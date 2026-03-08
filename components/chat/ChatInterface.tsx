"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { QuickActions } from "./QuickActions";
import { PaymentApprovalCard } from "./PaymentApprovalCard";
import { ImpactCard } from "./ImpactCard";
import { ZakatBreakdownCard } from "./ZakatBreakdownCard";
import { PostPaymentReflection } from "./PostPaymentReflection";
import { MuhasabahModal } from "@/components/shared/MuhasabahModal";
import { IslamicLoadingSpinner } from "@/components/shared/IslamicLoadingSpinner";
import { AgentProgressBar } from "./AgentProgressBar";
import type {
  Recommendation,
  ImpactReport,
  ZakatBreakdown,
} from "@/lib/agent/state";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AgentState {
  donorIntent: string | null;
  zakatBreakdown: ZakatBreakdown | null;
  recommendation: Recommendation | null;
  mayarInvoiceLink: string | null;
  paymentStatus: string | null;
  impactReport: ImpactReport | null;
  invoiceId: string | null;
}

interface ChatInterfaceProps {
  initialThreadId?: string | null;
  onThreadChange?: (threadId: string) => void;
}

/** Interval polling status pembayaran (ms) */
const POLL_INTERVAL = 5_000;
/** Batas waktu polling sebelum timeout (ms) — 10 menit */
const POLL_TIMEOUT = 10 * 60 * 1_000;

export function ChatInterface({
  initialThreadId,
  onThreadChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(
    initialThreadId ?? null,
  );
  const [agentState, setAgentState] = useState<AgentState>({
    donorIntent: null,
    zakatBreakdown: null,
    recommendation: null,
    mayarInvoiceLink: null,
    paymentStatus: null,
    impactReport: null,
    invoiceId: null,
  });
  const [showMuhasabah, setShowMuhasabah] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [nodeProgress, setNodeProgress] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollStartRef = useRef<number | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ------ Load Conversation History ------
  useEffect(() => {
    if (!initialThreadId) return;

    async function loadHistory() {
      setIsLoadingHistory(true);
      try {
        const res = await fetch(
          `/api/conversations/${encodeURIComponent(initialThreadId!)}/messages`,
        );
        if (!res.ok) return;
        const data = await res.json();

        const loadedMessages: Message[] = data.messages.map(
          (m: {
            id: string;
            role: string;
            content: string;
            createdAt: string;
          }) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date(m.createdAt),
          }),
        );
        setMessages(loadedMessages);

        // Restore agent state dari metadata pesan assistant terakhir
        const lastAssistant = [...data.messages]
          .reverse()
          .find(
            (m: { role: string; metadata: unknown }) =>
              m.role === "assistant" && m.metadata,
          );
        if (lastAssistant?.metadata) {
          const meta = lastAssistant.metadata as Record<string, unknown>;
          setAgentState({
            donorIntent: (meta.donorIntent as string) ?? null,
            zakatBreakdown: (meta.zakatBreakdown as ZakatBreakdown) ?? null,
            recommendation: (meta.recommendation as Recommendation) ?? null,
            mayarInvoiceLink: (meta.mayarInvoiceLink as string) ?? null,
            paymentStatus: (meta.paymentStatus as string) ?? null,
            impactReport: (meta.impactReport as ImpactReport) ?? null,
            invoiceId: (meta.invoiceId as string) ?? null,
          });
        }
      } catch {
        // Non-fatal: jika gagal load history, mulai fresh
      } finally {
        setIsLoadingHistory(false);
      }
    }

    loadHistory();
  }, [initialThreadId]);

  // ------ Payment Status Polling ------
  // Setelah invoice dibuat (invoiceId tersedia dan status "pending"),
  // poll GET /api/donations/status setiap 5 detik sampai paid/failed/expired
  useEffect(() => {
    const { invoiceId, paymentStatus } = agentState;
    if (!invoiceId || paymentStatus !== "pending") return;

    pollStartRef.current = Date.now();

    const intervalId = setInterval(async () => {
      // Timeout guard
      if (
        pollStartRef.current &&
        Date.now() - pollStartRef.current > POLL_TIMEOUT
      ) {
        clearInterval(intervalId);
        setMessages((prev) => [
          ...prev,
          {
            id: `timeout-${Date.now()}`,
            role: "assistant",
            content:
              "⏰ Pembayaran belum terdeteksi dalam 10 menit. Silakan cek email Anda atau klik link pembayaran kembali. Jika sudah membayar, refresh halaman ini.",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      try {
        const res = await fetch(
          `/api/donations/status?invoiceId=${encodeURIComponent(invoiceId)}`,
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "paid") {
          clearInterval(intervalId);
          setAgentState((prev) => ({ ...prev, paymentStatus: "paid" }));
          setMessages((prev) => [
            ...prev,
            {
              id: `paid-${Date.now()}`,
              role: "assistant",
              content:
                "✅ **Alhamdulillah!** Pembayaran Anda telah berhasil dikonfirmasi. Barakallah fiik — semoga Allah melipatgandakan kebaikan Anda. 🤲",
              timestamp: new Date(),
            },
          ]);
          // Tampilkan modal muhasabah setelah 30 detik refleksi
          setTimeout(() => setShowMuhasabah(true), 30_000);
        } else if (data.status === "failed" || data.status === "expired") {
          clearInterval(intervalId);
          setAgentState((prev) => ({ ...prev, paymentStatus: data.status }));
          setMessages((prev) => [
            ...prev,
            {
              id: `status-${Date.now()}`,
              role: "assistant",
              content:
                data.status === "failed"
                  ? "😔 Pembayaran gagal. Silakan coba lagi atau hubungi kami jika masalah berlanjut."
                  : "⏰ Link pembayaran telah kedaluwarsa. Silakan mulai proses donasi baru.",
              timestamp: new Date(),
            },
          ]);
        }
      } catch {
        // Polling error non-fatal — will retry on next interval
      }
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [agentState.invoiceId, agentState.paymentStatus]);

  async function sendMessage(
    content: string,
    opts?: { action?: "approve" | "edit" },
  ): Promise<void> {
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setNodeProgress(null);

    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          threadId,
          action: opts?.action,
        }),
      });

      if (!response.ok || !response.body) {
        // Fallback: try parsing as JSON error
        const errData = await response.json().catch(() => null);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            errData?.error ?? "Maaf, terjadi kendala. Silakan coba lagi. 🤲",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      // Parse SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep the last (potentially incomplete) line in the buffer
        buffer = lines.pop() ?? "";

        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith("data: ") && eventType) {
            const data = JSON.parse(line.slice(6));

            if (eventType === "thread" && data.threadId) {
              setThreadId(data.threadId);
              onThreadChange?.(data.threadId);
            } else if (eventType === "node") {
              setNodeProgress(data.label ?? data.node);
            } else if (eventType === "result" && data.success) {
              setNodeProgress(null);
              const assistantMessage: Message = {
                id: `ai-${Date.now()}`,
                role: "assistant",
                content: data.message,
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, assistantMessage]);

              if (data.state) {
                setAgentState((prev) => ({ ...prev, ...data.state }));
              }
            } else if (eventType === "error") {
              setNodeProgress(null);
              const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content:
                  data.error ?? "Maaf, terjadi kendala. Silakan coba lagi. 🤲",
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMessage]);
            }
            eventType = "";
          }
        }
      }
    } catch {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Maaf, koneksi terputus. Silakan coba lagi. 🤲",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setNodeProgress(null);
    }
  }

  function handleApprovePayment(): void {
    // Resume graph dari interrupt() dengan aksi "approve"
    sendMessage("Bayar sekarang", { action: "approve" });
  }

  function handleEditAllocation(): void {
    // Reset dan buat thread baru untuk konverasi baru
    setThreadId(null);
    setAgentState({
      donorIntent: null,
      zakatBreakdown: null,
      recommendation: null,
      mayarInvoiceLink: null,
      paymentStatus: null,
      impactReport: null,
      invoiceId: null,
    });
    sendMessage("Saya ingin mengubah alokasi donasi");
  }

  /** Reset chat untuk memulai percakapan baru */
  function startNewChat(): void {
    setThreadId(null);
    setMessages([]);
    setAgentState({
      donorIntent: null,
      zakatBreakdown: null,
      recommendation: null,
      mayarInvoiceLink: null,
      paymentStatus: null,
      impactReport: null,
      invoiceId: null,
    });
  }

  const showQuickActions = messages.length === 0 && !isLoadingHistory;
  const showZakatBreakdown =
    agentState.zakatBreakdown !== null &&
    agentState.zakatBreakdown.totalKewajiban > 0;
  const showPaymentApproval =
    agentState.recommendation &&
    !agentState.mayarInvoiceLink &&
    agentState.paymentStatus !== "paid";
  // Show Islamic spinner only during the payment approval-to-invoice step
  const showIslamicSpinner = isLoading && showPaymentApproval;
  const showPostPaymentReflection =
    agentState.paymentStatus === "paid" && !agentState.impactReport;
  const showImpactReport =
    agentState.impactReport && agentState.paymentStatus === "paid";

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-surface-warm md:h-screen">
      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        {isLoadingHistory && (
          <div className="mx-auto max-w-3xl px-4 py-8 text-center">
            <IslamicLoadingSpinner message="Memuat riwayat percakapan..." />
          </div>
        )}

        {showQuickActions && <QuickActions onSelect={sendMessage} />}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {isLoading && !showIslamicSpinner && (
          <div className="mx-auto max-w-3xl px-4 py-4">
            {nodeProgress ? (
              <AgentProgressBar currentLabel={nodeProgress} />
            ) : (
              <MessageBubble role="assistant" content="" isLoading />
            )}
          </div>
        )}

        {showIslamicSpinner && (
          <div className="mx-auto max-w-3xl px-4 py-4">
            <IslamicLoadingSpinner message="Sedang menyiapkan invoice pembayaran Anda..." />
          </div>
        )}

        {/* Zakat Breakdown Card */}
        {showZakatBreakdown && agentState.zakatBreakdown && (
          <div className="mx-auto max-w-3xl px-4 py-2">
            <ZakatBreakdownCard breakdown={agentState.zakatBreakdown} />
          </div>
        )}

        {/* Payment Approval Card */}
        {showPaymentApproval && agentState.recommendation && (
          <div className="mx-auto max-w-3xl px-4 py-2">
            <PaymentApprovalCard
              recommendation={agentState.recommendation}
              onApprove={handleApprovePayment}
              onEdit={handleEditAllocation}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Post-Payment Spiritual Reflection */}
        {showPostPaymentReflection && agentState.recommendation && (
          <div className="mx-auto max-w-3xl px-4 py-2">
            <PostPaymentReflection
              amount={agentState.recommendation.totalAmount}
              donorIntent={agentState.donorIntent}
              islamicContext={agentState.recommendation.islamicContext}
            />
          </div>
        )}

        {/* Impact Report Card */}
        {showImpactReport && agentState.impactReport && (
          <div className="mx-auto max-w-3xl px-4 py-2">
            <ImpactCard report={agentState.impactReport} />
          </div>
        )}
      </div>

      {/* Muhasabah Modal */}
      <MuhasabahModal
        open={showMuhasabah}
        onClose={() => setShowMuhasabah(false)}
      />

      {/* Input Area */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        placeholder={
          showPaymentApproval
            ? "Konfirmasi pembayaran atau ubah alokasi..."
            : 'Ketik pesan Anda... (misal: "Saya ingin bayar zakat")'
        }
      />
    </div>
  );
}
