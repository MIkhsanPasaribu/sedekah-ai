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
import { sanitizeModelOutput } from "@/lib/agent/utils";

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

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json();
    const { messages, threadId, action } = body as {
      messages?: Array<{ role: string; content: string }>;
      threadId?: string;
      action?: "approve" | "edit";
    };

    const resolvedThreadId = threadId ?? crypto.randomUUID();
    const config = { configurable: { thread_id: resolvedThreadId } };

    // Auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 },
      );
    }

    // Rate limiting (persistent, DB-backed)
    const allowed = await checkRateLimitPersistent(user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Mohon tunggu beberapa menit." },
        { status: 429 },
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
      return NextResponse.json(
        { error: "Gagal memproses akun pengguna. Silakan coba lagi." },
        { status: 500 },
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
        return NextResponse.json(
          { error: "Pesan tidak boleh kosong" },
          { status: 400 },
        );
      }
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage?.content) {
        return NextResponse.json(
          { error: "Pesan terakhir tidak valid" },
          { status: 400 },
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

    const stream = new ReadableStream({
      async start(controller) {
        let isControllerClosed = false;

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

          // Use streamEvents for token-level streaming —
          // this gives us both node progress AND individual LLM tokens
          const eventStream = graph.streamEvents(graphInput, {
            ...config,
            version: "v2",
          });

          let currentNode = "";

          for await (const event of eventStream) {
            if (isControllerClosed) {
              break;
            }

            const eventKind: string = event.event;

            // Track which node is currently executing
            if (eventKind === "on_chain_start" && event.name) {
              const nodeName = event.name;
              if (NODE_LABELS[nodeName]) {
                currentNode = nodeName;
                const label = NODE_LABELS[nodeName];
                if (!send("node", { node: nodeName, label })) {
                  break;
                }
              }
            }

            // Token-level streaming: emit each LLM token chunk
            if (eventKind === "on_chat_model_stream" && event.data?.chunk) {
              // Intentionally suppress raw token streaming to avoid exposing
              // model reasoning traces like <think> blocks in the UI.
              continue;
            }
          }

          if (isControllerClosed) {
            return;
          }

          // Get final state and check for interrupts
          const graphState = await graph.getState(config);
          const needsApproval = graphState.next.length > 0;
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
            return;
          }

          send("done", {});
        } catch (error) {
          console.error("[Agent API Streaming Error]:", error);
          const message =
            error instanceof Error && error.message.includes("API key")
              ? "Konfigurasi AI belum lengkap. Hubungi administrator."
              : "Maaf, terjadi kendala teknis. Silakan coba beberapa saat lagi. 🤲";
          send("error", { error: message });
        } finally {
          if (!isControllerClosed) {
            try {
              controller.close();
            } catch {
              // Ignore close race when stream was already terminated.
            }
            isControllerClosed = true;
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[Agent API Error]:", error);
    const message =
      error instanceof Error && error.message.includes("API key")
        ? "Konfigurasi AI belum lengkap. Hubungi administrator."
        : "Maaf, terjadi kendala teknis. Silakan coba beberapa saat lagi. 🤲";
    return NextResponse.json(
      { error: message, success: false },
      { status: 500 },
    );
  }
}
