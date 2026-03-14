// ============================================================
// API Route — LangGraph Agent (Streaming SSE)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { getSedekahGraph } from "@/lib/agent/graph";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── In-memory rate limiter (10 requests per 5 minutes per user) ──────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

/** Node name → user-facing label */
const NODE_LABELS: Record<string, string> = {
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

    // Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Mohon tunggu beberapa menit." },
        { status: 429 },
      );
    }
    const donorEmail: string = user.email;
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, name: true },
    });
    const donorName: string = dbUser?.name ?? user.email.split("@")[0];

    // Upsert conversation record
    let conversation: { id: string } | null = null;
    if (dbUser) {
      const lastUserMsg = messages?.[messages.length - 1]?.content;
      const title = lastUserMsg
        ? lastUserMsg.slice(0, 60) + (lastUserMsg.length > 60 ? "..." : "")
        : "Percakapan Baru";

      conversation = await prisma.conversation.upsert({
        where: { threadId: resolvedThreadId },
        update: { updatedAt: new Date() },
        create: {
          userId: dbUser.id,
          threadId: resolvedThreadId,
          title,
        },
        select: { id: true },
      });
    }

    const graph = await getSedekahGraph();

    // Prepare graph input
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let graphInput: any;
    if (action === "approve" || action === "edit") {
      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "user",
            content: action === "approve" ? "Bayar sekarang" : "Ubah alokasi",
          },
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
      if (conversation) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            role: "user",
            content: lastMessage.content,
          },
        });
      }
      graphInput = {
        messages: [new HumanMessage(lastMessage.content)],
        donorName,
        donorEmail,
      };
    }

    // --- SSE Streaming ---
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        function send(event: string, data: unknown): void {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        }

        try {
          send("thread", { threadId: resolvedThreadId });

          // Stream graph execution — streamMode "updates" gives us per-node outputs
          const eventStream = await graph.stream(graphInput, {
            ...config,
            streamMode: "updates",
          });

          let lastNodeResult: Record<string, unknown> = {};
          for await (const chunk of eventStream) {
            // chunk is { NodeName: { ...partialState } }
            for (const [nodeName, nodeOutput] of Object.entries(chunk)) {
              const label = NODE_LABELS[nodeName] ?? nodeName;
              send("node", { node: nodeName, label });
              lastNodeResult = {
                ...lastNodeResult,
                ...(nodeOutput as Record<string, unknown>),
              };
            }
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

          const responseContent =
            typeof lastAiMessage?.content === "string"
              ? lastAiMessage.content
              : needsApproval
                ? "Berikut rekomendasi donasi Anda. Silakan konfirmasi untuk melanjutkan pembayaran."
                : "Maaf, terjadi kesalahan. Silakan coba lagi.";

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
          if (conversation) {
            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                role: "assistant",
                content: responseContent,
                metadata: stateSnapshot,
              },
            });
          }

          // Send final result
          send("result", {
            success: true,
            threadId: resolvedThreadId,
            needsApproval,
            message: responseContent,
            state: stateSnapshot,
          });

          send("done", {});
        } catch (error) {
          console.error("[Agent API Streaming Error]:", error);
          const message =
            error instanceof Error && error.message.includes("API key")
              ? "Konfigurasi AI belum lengkap. Hubungi administrator."
              : "Maaf, terjadi kendala teknis. Silakan coba beberapa saat lagi. 🤲";
          send("error", { error: message });
        } finally {
          controller.close();
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
