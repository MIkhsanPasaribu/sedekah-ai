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
import { validateRecommendationRuntime } from "@/lib/validations/recommendation";
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

function createInitialAgentState(): AgentState {
  return {
    donorIntent: null,
    zakatBreakdown: null,
    recommendation: null,
    mayarInvoiceLink: null,
    paymentStatus: null,
    impactReport: null,
    invoiceId: null,
  };
}

/** Interval polling status pembayaran (ms) */
const POLL_INTERVAL = 5_000;
/** Batas waktu polling sebelum timeout (ms) — 10 menit */
const POLL_TIMEOUT = 10 * 60 * 1_000;
/** Timeout request ke agent SSE agar UI tidak stuck */
const AGENT_INITIAL_RESPONSE_TIMEOUT = 45_000;
/** Idle timeout stream SSE setelah response berjalan */
const AGENT_STREAM_IDLE_TIMEOUT = 90_000;
/** Flush interval token streaming per karakter agar render tetap ringan */
const STREAM_TOKEN_FLUSH_INTERVAL_MS = 18;

export function ChatInterface({
  initialThreadId,
  onThreadChange,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(
    initialThreadId ?? null,
  );
  const [agentState, setAgentState] = useState<AgentState>(
    createInitialAgentState,
  );
  const [showMuhasabah, setShowMuhasabah] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [nodeProgress, setNodeProgress] = useState<string | null>(null);
  /** Token-level streaming: progressively accumulates AI response text */
  const [streamingContent, setStreamingContent] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollStartRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const historyAbortRef = useRef<AbortController | null>(null);
  const sseAbortRef = useRef<AbortController | null>(null);
  const streamBufferRef = useRef<string>("");
  const streamFlushTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const stopTokenFlusher = useCallback(() => {
    if (streamFlushTimerRef.current) {
      clearInterval(streamFlushTimerRef.current);
      streamFlushTimerRef.current = null;
    }
  }, []);

  const startTokenFlusher = useCallback(() => {
    if (streamFlushTimerRef.current) return;

    streamFlushTimerRef.current = setInterval(() => {
      if (!streamBufferRef.current) {
        stopTokenFlusher();
        return;
      }

      const nextChar = streamBufferRef.current[0] ?? "";
      streamBufferRef.current = streamBufferRef.current.slice(1);
      if (!nextChar) return;

      setStreamingContent((prev) => prev + nextChar);
    }, STREAM_TOKEN_FLUSH_INTERVAL_MS);
  }, [stopTokenFlusher]);

  const resetStreamingBuffer = useCallback(() => {
    streamBufferRef.current = "";
    stopTokenFlusher();
  }, [stopTokenFlusher]);

  // Mark unmounted to prevent setState after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      historyAbortRef.current?.abort();
      sseAbortRef.current?.abort();
      resetStreamingBuffer();
    };
  }, [resetStreamingBuffer]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Keep local thread state in sync with route query changes.
  useEffect(() => {
    setThreadId(initialThreadId ?? null);
  }, [initialThreadId]);

  // ------ Load Conversation History ------
  useEffect(() => {
    if (!initialThreadId) {
      historyAbortRef.current?.abort();
      setMessages([]);
      setAgentState(createInitialAgentState());
      setNodeProgress(null);
      setStreamingContent("");
      resetStreamingBuffer();
      setIsLoadingHistory(false);
      return;
    }

    async function loadHistory() {
      historyAbortRef.current?.abort();
      const controller = new AbortController();
      historyAbortRef.current = controller;

      setIsLoadingHistory(true);
      setMessages([]);
      setAgentState(createInitialAgentState());
      try {
        const res = await fetch(
          `/api/conversations/${encodeURIComponent(initialThreadId!)}/messages`,
          { signal: controller.signal },
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
              "⏰ Pembayaran belum terdeteksi dalam 10 menit.\n\nLangkah berikutnya:\n1. Jika sudah membayar, refresh halaman ini.\n2. Jika belum, klik ulang link pembayaran.\n3. Jika transaksi terpotong tapi status belum berubah, tunggu 2-3 menit lalu cek lagi.",
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

    return () => {
      clearInterval(intervalId);
      pollStartRef.current = null;
    };
  }, [agentState.invoiceId, agentState.paymentStatus]);

  async function sendMessage(
    content: string,
    opts?: { action?: "approve" | "edit" },
  ): Promise<void> {
    // Abort any in-flight SSE request before starting a new one
    sseAbortRef.current?.abort();
    const sseController = new AbortController();
    sseAbortRef.current = sseController;
    let didTimeout = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const setRequestTimeout = (duration: number): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        didTimeout = true;
        if (!sseController.signal.aborted) {
          sseController.abort();
        }
      }, duration);
    };

    const clearRequestTimeout = (): void => {
      if (!timeoutId) return;
      clearTimeout(timeoutId);
      timeoutId = null;
    };

    const safeCancelReader = async (): Promise<void> => {
      if (!reader) return;
      try {
        await reader.cancel();
      } catch {
        // Ignore stream cancellation errors on aborted bodies.
      }
    };

    setRequestTimeout(AGENT_INITIAL_RESPONSE_TIMEOUT);

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setNodeProgress(null);
    setStreamingContent("");
    resetStreamingBuffer();

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
      const response = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: sseController.signal,
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
        clearRequestTimeout();
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
      reader = response.body.getReader();
      setRequestTimeout(AGENT_STREAM_IDLE_TIMEOUT);
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setRequestTimeout(AGENT_STREAM_IDLE_TIMEOUT);

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
            } else if (eventType === "token" && data.content) {
              // Buffer token text and flush per-character for smoother UX.
              streamBufferRef.current += String(data.content);
              startTokenFlusher();
            } else if (eventType === "node") {
              setNodeProgress(data.label ?? data.node);
            } else if (eventType === "result" && data.success) {
              resetStreamingBuffer();
              setStreamingContent(""); // Clear streaming preview
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
              resetStreamingBuffer();
              setStreamingContent("");
              const errorMessage: Message = {
                id: `error-${Date.now()}`,
                role: "assistant",
                content:
                  data.error ?? "Maaf, terjadi kendala. Silakan coba lagi. 🤲",
                timestamp: new Date(),
              };
              setMessages((prev) => [...prev, errorMessage]);
            } else if (eventType === "done") {
              resetStreamingBuffer();
            }
            eventType = "";
          }
        }
      }
    } catch (err) {
      // Ignore AbortError (user navigated away or started new message)
      if (err instanceof Error && err.name === "AbortError") {
        if (didTimeout && isMountedRef.current) {
          const timeoutMessage: Message = {
            id: `timeout-${Date.now()}`,
            role: "assistant",
            content:
              "⏳ Permintaan sedang lebih lama dari biasanya. Silakan coba lagi sebentar, atau ulangi klik Bayar Sekarang.",
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, timeoutMessage]);
        }
        return;
      }
      await safeCancelReader();
      if (isMountedRef.current) {
        resetStreamingBuffer();
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Maaf, koneksi terputus. Silakan coba lagi. 🤲",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      clearRequestTimeout();
      await safeCancelReader();
      resetStreamingBuffer();
      if (isMountedRef.current) {
        setIsLoading(false);
        setNodeProgress(null);
      }
    }
  }

  function handleApprovePayment(): void {
    const recommendation = validateRecommendationRuntime(
      agentState.recommendation,
    );
    if (isLoading || !recommendation) {
      return;
    }

    // Resume graph dari interrupt() dengan aksi "approve"
    void sendMessage("Bayar sekarang", { action: "approve" });
  }

  function handleEditAllocation(): void {
    const recommendation = validateRecommendationRuntime(
      agentState.recommendation,
    );
    if (isLoading || !recommendation) {
      return;
    }

    // Resume graph dari interrupt() dengan aksi "edit"
    void sendMessage("Ubah alokasi", { action: "edit" });
  }

  const showQuickActions = messages.length === 0 && !isLoadingHistory;
  const validatedRecommendation = validateRecommendationRuntime(
    agentState.recommendation,
  );
  const showZakatBreakdown =
    agentState.zakatBreakdown !== null &&
    agentState.zakatBreakdown.totalKewajiban > 0;
  const showPaymentApproval =
    validatedRecommendation &&
    validatedRecommendation.totalAmount > 0 &&
    !agentState.mayarInvoiceLink &&
    agentState.paymentStatus !== "paid";
  // Show Islamic spinner only during the payment approval-to-invoice step
  const showIslamicSpinner = isLoading && showPaymentApproval;
  const showPostPaymentReflection =
    agentState.paymentStatus === "paid" && !agentState.impactReport;
  const showImpactReport =
    agentState.impactReport && agentState.paymentStatus === "paid";
  const showPaymentLinkCta =
    !!agentState.mayarInvoiceLink && agentState.paymentStatus === "pending";

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

        {/* Live Token Streaming Preview */}
        {isLoading && streamingContent && (
          <MessageBubble
            role="assistant"
            content={streamingContent}
            timestamp={new Date()}
            isStreaming
          />
        )}

        {isLoading && !showIslamicSpinner && (
          <div className="mx-auto max-w-3xl px-4 py-4">
            {nodeProgress ? (
              <AgentProgressBar currentLabel={nodeProgress} />
            ) : !streamingContent ? (
              <MessageBubble role="assistant" content="" isLoading />
            ) : null}
            {streamingContent ? (
              <p className="mt-2 text-xs text-ink-light">
                Amil AI sedang mengetik jawaban...
              </p>
            ) : null}
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
        {showPaymentApproval && validatedRecommendation && (
          <div className="mx-auto max-w-3xl px-4 py-2">
            <PaymentApprovalCard
              recommendation={validatedRecommendation}
              onApprove={handleApprovePayment}
              onEdit={handleEditAllocation}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Payment Link CTA */}
        {showPaymentLinkCta && (
          <div className="mx-auto max-w-3xl px-4 py-2">
            <div className="rounded-2xl border border-brand-gold-pale bg-brand-gold-ghost p-4 shadow-sm">
              <p className="text-sm font-semibold text-ink-black">
                🔗 Link pembayaran sudah siap
              </p>
              <p className="mt-1 text-xs text-ink-mid">
                Klik tombol di bawah untuk menyelesaikan pembayaran Anda.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={agentState.mayarInvoiceLink ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg bg-brand-green-deep px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green-mid"
                >
                  💳 Buka Halaman Pembayaran
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (agentState.mayarInvoiceLink) {
                      navigator.clipboard
                        .writeText(agentState.mayarInvoiceLink)
                        .catch(() => undefined);
                    }
                  }}
                  className="inline-flex items-center rounded-lg border border-ink-ghost bg-white px-4 py-2 text-sm font-medium text-ink-dark hover:bg-slate-50"
                >
                  Salin Link
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post-Payment Spiritual Reflection */}
        {showPostPaymentReflection && validatedRecommendation && (
          <div className="mx-auto max-w-3xl px-4 py-2">
            <PostPaymentReflection
              amount={validatedRecommendation.totalAmount}
              donorIntent={agentState.donorIntent}
              islamicContext={validatedRecommendation.islamicContext}
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
