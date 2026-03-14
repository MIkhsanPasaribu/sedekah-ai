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
    const metadata = user.user_metadata as Record<string, unknown> | undefined;
    const inferredName =
      (typeof metadata?.full_name === "string" && metadata.full_name) ||
      (typeof metadata?.name === "string" && metadata.name) ||
      user.email.split("@")[0];

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
    const donorName: string = dbUser?.name ?? user.email.split("@")[0];

    // Upsert conversation record
    let conversation: { id: string } | null = null;
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

      // --- Conversation History Memory (#6) ---
      // Load recent messages from DB for multi-turn awareness
      let historyContext: string | null = null;
      if (conversation) {
        const recentMessages = await prisma.message.findMany({
          where: { conversationId: conversation.id },
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
        function send(event: string, data: unknown): void {
          controller.enqueue(
            encoder.encode(
              `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
            ),
          );
        }

        try {
          send("thread", { threadId: resolvedThreadId });

          // Use streamEvents for token-level streaming —
          // this gives us both node progress AND individual LLM tokens
          const eventStream = graph.streamEvents(graphInput, {
            ...config,
            version: "v2",
          });

          let currentNode = "";
          const tokenBuffer: string[] = [];

          for await (const event of eventStream) {
            const eventKind: string = event.event;

            // Track which node is currently executing
            if (eventKind === "on_chain_start" && event.name) {
              const nodeName = event.name;
              if (NODE_LABELS[nodeName]) {
                currentNode = nodeName;
                const label = NODE_LABELS[nodeName];
                send("node", { node: nodeName, label });
              }
            }

            // Token-level streaming: emit each LLM token chunk
            if (eventKind === "on_chat_model_stream" && event.data?.chunk) {
              const chunk = event.data.chunk;
              const content =
                typeof chunk.content === "string" ? chunk.content : "";
              if (content) {
                tokenBuffer.push(content);
                send("token", { content, node: currentNode });
              }
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
