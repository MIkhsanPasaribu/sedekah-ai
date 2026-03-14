// ============================================================
// API Route — LangGraph Agent (Streaming SSE)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { getSedekahGraph } from "@/lib/agent/graph";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimitPersistent } from "@/lib/rate-limiter";
import { inferUserName } from "@/lib/auth/infer-user-name";
import type { Prisma } from "@/generated/prisma/client";
import {
  createStreamTokenSanitizer,
  extractTextFromChatStreamChunk,
  sanitizeModelOutput,
} from "@/lib/agent/utils";
import { getAiRuntimeConfig } from "@/lib/env";
import { recordAgentStreamMetric } from "@/lib/agent/observability";

export const runtime = "nodejs";
export const maxDuration = 60;

// Rate limiting uses DB-backed persistent storage (see lib/rate-limiter.ts)

/** Node name → user-facing label */
const NODE_LABELS: Record<string, string> = {
  SUPERVISOR: "Memahami permintaan Anda...",
  INTAKE: "Memahami niat Anda...",
  CALCULATE: "Menghitung zakat...",
  RESEARCH: "Mencari kampanye terpercaya...",
  FRAUD_DETECTOR: "Menganalisis keamanan...",
  RECOMMEND: "Menyusun rekomendasi...",
  PAYMENT_APPROVAL: "Menunggu konfirmasi Anda...",
  PAYMENT_EXECUTOR: "Memproses pembayaran...",
  IMPACT_TRACKER: "Menyiapkan laporan dampak...",
};

const REDACTED_KEY_PATTERN =
  /(email|token|authorization|cookie|password|secret|content|message|metadata|body)/i;

function sanitizeLogValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > 240 ? `${value.slice(0, 240)}...` : value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeLogValue(item));
  }

  if (typeof value === "object" && value !== null) {
    return sanitizeLogPayload(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeLogPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (REDACTED_KEY_PATTERN.test(key)) {
      sanitized[key] = "[REDACTED]";
      continue;
    }

    sanitized[key] = sanitizeLogValue(value);
  }

  return sanitized;
}

function logAgentEvent(
  level: "info" | "warn" | "error",
  event: string,
  correlationId: string,
  payload: Record<string, unknown> = {},
): void {
  const safePayload = sanitizeLogPayload(payload);
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    correlationId,
    ...safePayload,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

function jsonWithCorrelation(
  body: Record<string, unknown>,
  status: number,
  correlationId: string,
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "x-correlation-id": correlationId,
    },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  const correlationId =
    req.headers.get("x-correlation-id")?.trim() || crypto.randomUUID();
  const requestStartMs = Date.now();

  try {
    const body = await req.json();
    const { messages, threadId, action } = body as {
      messages?: Array<{ role: string; content: string }>;
      threadId?: string;
      action?: "approve" | "edit";
    };

    logAgentEvent("info", "agent.request.received", correlationId, {
      action: action ?? null,
      incomingThreadId: threadId ?? null,
      messageCount: messages?.length ?? 0,
    });

    const resolvedThreadId = threadId ?? crypto.randomUUID();
    const config = { configurable: { thread_id: resolvedThreadId } };

    // Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      logAgentEvent("warn", "agent.auth.unauthorized", correlationId, {
        threadId: resolvedThreadId,
      });
      return jsonWithCorrelation(
        { error: "Silakan login terlebih dahulu" },
        401,
        correlationId,
      );
    }

    // Rate limiting (persistent, DB-backed)
    const allowed = await checkRateLimitPersistent(user.id);
    if (!allowed) {
      logAgentEvent("warn", "agent.rate_limited", correlationId, {
        userId: user.id,
        threadId: resolvedThreadId,
      });
      return jsonWithCorrelation(
        { error: "Terlalu banyak permintaan. Mohon tunggu beberapa menit." },
        429,
        correlationId,
      );
    }
    const donorEmail: string = user.email;
    const inferredName = inferUserName(user, user.email.split("@")[0]);

    let dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, name: true },
    });

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          authId: user.id,
          email: user.email,
          name: inferredName,
        },
        select: { id: true, name: true },
      });
    }
    const dbUserId = dbUser?.id;
    if (!dbUserId) {
      logAgentEvent("error", "agent.user.resolve_failed", correlationId, {
        threadId: resolvedThreadId,
      });
      return jsonWithCorrelation(
        { error: "Gagal memproses akun pengguna. Silakan coba lagi." },
        500,
        correlationId,
      );
    }
    const donorName: string = dbUser?.name ?? user.email.split("@")[0];

    // Upsert conversation record
    let conversationId: string | null = null;
    const lastUserMsg = messages?.[messages.length - 1]?.content;
    const title = lastUserMsg
      ? lastUserMsg.slice(0, 60) + (lastUserMsg.length > 60 ? "..." : "")
      : "Percakapan Baru";

    async function ensureConversationId(): Promise<string> {
      const conversation = await prisma.conversation.upsert({
        where: { threadId: resolvedThreadId },
        update: { updatedAt: new Date() },
        create: {
          userId: dbUserId,
          threadId: resolvedThreadId,
          title,
        },
        select: { id: true },
      });

      conversationId = conversation.id;
      return conversation.id;
    }

    async function createMessageSafely(data: {
      role: "user" | "assistant" | "system";
      content: string;
      metadata?: Prisma.InputJsonValue;
    }): Promise<void> {
      if (!conversationId) {
        conversationId = await ensureConversationId();
      }

      try {
        await prisma.message.create({
          data: {
            conversationId,
            role: data.role,
            content: data.content,
            metadata: data.metadata,
          },
        });
      } catch (error) {
        const code =
          typeof error === "object" && error !== null && "code" in error
            ? String((error as { code?: unknown }).code)
            : "";

        // Conversation may be deleted while stream is running. Recreate and retry once.
        if (code === "P2003") {
          logAgentEvent("warn", "agent.message.retry_after_fk", correlationId, {
            threadId: resolvedThreadId,
            role: data.role,
          });
          const recoveredConversationId = await ensureConversationId();
          await prisma.message.create({
            data: {
              conversationId: recoveredConversationId,
              role: data.role,
              content: data.content,
              metadata: data.metadata,
            },
          });
          return;
        }

        throw error;
      }
    }

    conversationId = await ensureConversationId();

    const graph = await getSedekahGraph();

    // Prepare graph input
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let graphInput: any;
    if (action === "approve" || action === "edit") {
      if (conversationId) {
        await createMessageSafely({
          role: "user",
          content: action === "approve" ? "Bayar sekarang" : "Ubah alokasi",
        });
      }
      graphInput = new Command({ resume: action });
    } else {
      if (!messages || messages.length === 0) {
        return jsonWithCorrelation(
          { error: "Pesan tidak boleh kosong" },
          400,
          correlationId,
        );
      }
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage?.content) {
        return jsonWithCorrelation(
          { error: "Pesan terakhir tidak valid" },
          400,
          correlationId,
        );
      }
      if (conversationId) {
        await createMessageSafely({
          role: "user",
          content: lastMessage.content,
        });
      }

      // --- Conversation History Memory (#6) ---
      // Load recent messages from DB for multi-turn awareness
      let historyContext: string | null = null;
      if (conversationId) {
        const recentMessages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { createdAt: "desc" },
          take: 6, // 5 previous + the one we just saved
          skip: 1, // Skip the one we just created
          select: { role: true, content: true },
        });

        if (recentMessages.length > 0) {
          historyContext = recentMessages
            .reverse()
            .map(
              (m) =>
                `${m.role === "user" ? "Donatur" : "Amil AI"}: ${m.content.slice(0, 200)}`,
            )
            .join("\n");
        }
      }

      const graphMessages = historyContext
        ? [
            new SystemMessage(
              `Ringkasan percakapan sebelumnya:\n${historyContext}\n\nLanjutkan percakapan dengan mempertimbangkan konteks di atas.`,
            ),
            new HumanMessage(lastMessage.content),
          ]
        : [new HumanMessage(lastMessage.content)];

      graphInput = {
        messages: graphMessages,
        donorName,
        donorEmail,
      };
    }

    // --- SSE Streaming with Token-Level Events ---
    const encoder = new TextEncoder();
    const aiRuntime = getAiRuntimeConfig();

    const stream = new ReadableStream({
      async start(controller) {
        let isControllerClosed = false;
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
        const streamStartedAtMs = Date.now();
        const metrics = {
          heartbeatCount: 0,
          eventCounts: {} as Record<string, number>,
          nodeSequence: [] as string[],
          nodeDurationsMs: {} as Record<string, number>,
          sendFailureCount: 0,
          responseFallbackUsed: false,
          tokenEvents: 0,
          tokenCharsSent: 0,
          tokenDroppedByPolicy: 0,
        };
        let streamResult: "completed" | "errored" | "client_disconnected" =
          "completed";
        let needsApprovalValue: boolean | null = null;
        let currentNode = "";
        let currentNodeStartedAtMs = Date.now();
        const sanitizeStreamToken = createStreamTokenSanitizer();

        logAgentEvent("info", "agent.stream.started", correlationId, {
          threadId: resolvedThreadId,
          action: action ?? null,
        });

        function send(event: string, data: unknown): boolean {
          if (isControllerClosed) return false;

          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            );
            return true;
          } catch (error) {
            // Happens when client disconnects or stream is already closed.
            if (
              error instanceof Error &&
              (error.message.includes("Controller is already closed") ||
                error.message.includes("Invalid state"))
            ) {
              metrics.sendFailureCount += 1;
              streamResult = "client_disconnected";
              isControllerClosed = true;
              return false;
            }
            throw error;
          }
        }

        try {
          if (!send("thread", { threadId: resolvedThreadId })) {
            return;
          }

          send("meta", { correlationId });

          heartbeatTimer = setInterval(() => {
            metrics.heartbeatCount += 1;
            if (!send("heartbeat", { timestamp: Date.now() })) {
              if (heartbeatTimer) {
                clearInterval(heartbeatTimer);
                heartbeatTimer = null;
              }
            }
          }, aiRuntime.sseHeartbeatMs);

          // Use streamEvents for token-level streaming —
          // this gives us both node progress AND individual LLM tokens
          const eventStream = graph.streamEvents(graphInput, {
            ...config,
            version: "v2",
          });

          for await (const event of eventStream) {
            if (isControllerClosed) {
              streamResult = "client_disconnected";
              break;
            }

            const eventKind: string = event.event;
            metrics.eventCounts[eventKind] =
              (metrics.eventCounts[eventKind] ?? 0) + 1;

            // Track which node is currently executing
            if (eventKind === "on_chain_start" && event.name) {
              const nodeName = event.name;
              if (NODE_LABELS[nodeName]) {
                if (currentNode) {
                  metrics.nodeDurationsMs[currentNode] =
                    (metrics.nodeDurationsMs[currentNode] ?? 0) +
                    (Date.now() - currentNodeStartedAtMs);
                }
                currentNode = nodeName;
                currentNodeStartedAtMs = Date.now();
                metrics.nodeSequence.push(nodeName);
                const label = NODE_LABELS[nodeName];
                if (!send("node", { node: nodeName, label })) {
                  streamResult = "client_disconnected";
                  break;
                }
              }
            }

            // Token-level streaming: emit each LLM token chunk
            if (eventKind === "on_chat_model_stream" && event.data?.chunk) {
              if (!aiRuntime.enableTokenStream) {
                continue;
              }

              const rawToken = extractTextFromChatStreamChunk(event.data.chunk);
              if (!rawToken) {
                continue;
              }

              const sanitizedToken = sanitizeStreamToken(rawToken);
              metrics.tokenDroppedByPolicy += sanitizedToken.droppedChars;

              if (!sanitizedToken.cleaned) {
                continue;
              }

              metrics.tokenEvents += 1;
              metrics.tokenCharsSent += sanitizedToken.cleaned.length;

              if (!send("token", { content: sanitizedToken.cleaned })) {
                streamResult = "client_disconnected";
                break;
              }

              continue;
            }
          }

          if (isControllerClosed) {
            return;
          }

          if (currentNode) {
            metrics.nodeDurationsMs[currentNode] =
              (metrics.nodeDurationsMs[currentNode] ?? 0) +
              (Date.now() - currentNodeStartedAtMs);
          }

          // Get final state and check for interrupts
          const graphState = await graph.getState(config);
          const needsApproval = graphState.next.length > 0;
          needsApprovalValue = needsApproval;
          const finalState = graphState.values as Record<string, unknown>;

          // Extract last AI message
          const resultMessages =
            (finalState.messages as Array<{
              _getType?: () => string;
              content?: string;
            }>) ?? [];
          const aiMessages = resultMessages.filter(
            (m) => m._getType?.() === "ai",
          );
          const lastAiMessage = aiMessages[aiMessages.length - 1];

          const responseContentRaw =
            typeof lastAiMessage?.content === "string"
              ? lastAiMessage.content
              : needsApproval
                ? "Berikut rekomendasi donasi Anda. Silakan konfirmasi untuk melanjutkan pembayaran."
                : "Maaf, terjadi kesalahan. Silakan coba lagi.";
          metrics.responseFallbackUsed =
            typeof lastAiMessage?.content !== "string";
          const responseContent = sanitizeModelOutput(responseContentRaw);

          const stateSnapshot = {
            donorIntent: finalState.donorIntent ?? null,
            zakatBreakdown: finalState.zakatBreakdown ?? null,
            recommendation: finalState.recommendation ?? null,
            mayarInvoiceLink: finalState.mayarInvoiceLink ?? null,
            paymentStatus: finalState.paymentStatus ?? null,
            impactReport: finalState.impactReport ?? null,
            invoiceId: finalState.invoiceId ?? null,
          };

          // Save assistant message to DB
          if (conversationId) {
            await createMessageSafely({
              role: "assistant",
              content: responseContent,
              metadata: stateSnapshot as Prisma.InputJsonValue,
            });
          }

          // Send final result
          if (
            !send("result", {
              success: true,
              threadId: resolvedThreadId,
              needsApproval,
              message: responseContent,
              state: stateSnapshot,
            })
          ) {
            streamResult = "client_disconnected";
            return;
          }

          send("done", {});

          logAgentEvent("info", "agent.stream.completed", correlationId, {
            threadId: resolvedThreadId,
            durationMs: Date.now() - streamStartedAtMs,
            needsApproval,
            metrics,
          });
        } catch (error) {
          streamResult = "errored";
          const errorMessage =
            error instanceof Error ? error.message : "unknown_error";
          logAgentEvent("error", "agent.stream.error", correlationId, {
            threadId: resolvedThreadId,
            error: errorMessage,
            metrics,
          });
          const message =
            error instanceof Error && error.message.includes("API key")
              ? "Konfigurasi AI belum lengkap. Hubungi administrator."
              : "Maaf, terjadi kendala teknis. Silakan coba beberapa saat lagi. 🤲";
          send("error", { error: message });
        } finally {
          if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
          }

          if (!isControllerClosed) {
            try {
              controller.close();
            } catch {
              // Ignore close race when stream was already terminated.
            }
            isControllerClosed = true;
          }

          if (streamResult !== "completed") {
            logAgentEvent(
              "warn",
              "agent.stream.finished_nonstandard",
              correlationId,
              {
                threadId: resolvedThreadId,
                result: streamResult,
                durationMs: Date.now() - streamStartedAtMs,
                metrics,
              },
            );
          }

          recordAgentStreamMetric({
            timestamp: new Date().toISOString(),
            correlationId,
            threadId: resolvedThreadId,
            durationMs: Date.now() - streamStartedAtMs,
            result: streamResult,
            action: action ?? null,
            needsApproval: needsApprovalValue,
            metrics,
          });
        }
      },
    });

    logAgentEvent("info", "agent.request.streaming_response", correlationId, {
      threadId: resolvedThreadId,
      durationMs: Date.now() - requestStartMs,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "x-correlation-id": correlationId,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "unknown_error";
    logAgentEvent("error", "agent.request.error", correlationId, {
      error: errorMessage,
      durationMs: Date.now() - requestStartMs,
    });
    const message =
      error instanceof Error && error.message.includes("API key")
        ? "Konfigurasi AI belum lengkap. Hubungi administrator."
        : "Maaf, terjadi kendala teknis. Silakan coba beberapa saat lagi. 🤲";
    return jsonWithCorrelation(
      { error: message, success: false },
      500,
      correlationId,
    );
  }
}
