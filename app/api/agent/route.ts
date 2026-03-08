// ============================================================
// API Route — LangGraph Agent (Streaming)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { getSedekahGraph } from "@/lib/agent/graph";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { messages, threadId, action } = body as {
      messages?: Array<{ role: string; content: string }>;
      threadId?: string;
      action?: "approve" | "edit";
    };

    // Generate or reuse thread ID for conversation continuity
    const resolvedThreadId = threadId ?? crypto.randomUUID();
    const config = { configurable: { thread_id: resolvedThreadId } };

    // Auth required — prevent unauthenticated LLM / Mayar usage
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
    const donorEmail: string = user.email;
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { name: true },
    });
    const donorName: string = dbUser?.name ?? user.email.split("@")[0];

    const graph = getSedekahGraph();
    let result;

    if (action === "approve" || action === "edit") {
      // Resume graph from the interrupt() point
      result = await graph.invoke(new Command({ resume: action }), config);
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
      result = await graph.invoke(
        {
          messages: [new HumanMessage(lastMessage.content)],
          donorName,
          donorEmail,
        },
        config,
      );
    }

    // Detect if graph is paused at interrupt() waiting for human approval
    const graphState = await graph.getState(config);
    const needsApproval = graphState.next.length > 0;

    // Extract last AI message
    const resultMessages = result.messages ?? [];
    const aiMessages = resultMessages.filter(
      (m: { _getType?: () => string }) => m._getType?.() === "ai",
    );
    const lastAiMessage = aiMessages[aiMessages.length - 1];

    const responseContent =
      typeof lastAiMessage?.content === "string"
        ? lastAiMessage.content
        : needsApproval
          ? "Berikut rekomendasi donasi Anda. Silakan konfirmasi untuk melanjutkan pembayaran."
          : "Maaf, terjadi kesalahan. Silakan coba lagi.";

    return NextResponse.json({
      success: true,
      threadId: resolvedThreadId,
      needsApproval,
      message: responseContent,
      state: {
        donorIntent: result.donorIntent ?? null,
        zakatBreakdown: result.zakatBreakdown ?? null,
        recommendation: result.recommendation ?? null,
        mayarInvoiceLink: result.mayarInvoiceLink ?? null,
        paymentStatus: result.paymentStatus ?? null,
        impactReport: result.impactReport ?? null,
        invoiceId: result.invoiceId ?? null,
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
