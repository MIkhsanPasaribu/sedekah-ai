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

/** Interval polling status pembayaran (ms) */
const POLL_INTERVAL = 5_000;
/** Batas waktu polling sebelum timeout (ms) — 10 menit */
const POLL_TIMEOUT = 10 * 60 * 1_000;

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
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
          // Tampilkan modal muhasabah setelah jeda singkat
          setTimeout(() => setShowMuhasabah(true), 2000);
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

      const data = await response.json();

      if (data.success) {
        // Persist threadId for conversation continuity
        if (data.threadId) setThreadId(data.threadId);

        const assistantMessage: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Update agent state
        if (data.state) {
          setAgentState((prev) => ({
            ...prev,
            ...data.state,
          }));
        }
      } else {
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: data.error ?? "Maaf, terjadi kendala. Silakan coba lagi. 🤲",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
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
    }
  }

  function handleApprovePayment(): void {
    // Resume graph dari interrupt() dengan aksi "approve"
    sendMessage("Bayar sekarang", { action: "approve" });
  }

  function handleEditAllocation(): void {
    // Reset conversation agar user bisa ubah dari awal
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

  const showQuickActions = messages.length === 0;
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
          <MessageBubble role="assistant" content="" isLoading />
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
