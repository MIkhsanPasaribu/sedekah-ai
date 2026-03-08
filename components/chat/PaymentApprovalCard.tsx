"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { TrustScoreBar } from "@/components/shared/TrustScoreBadge";
import { formatRupiah } from "@/lib/utils";
import type { Recommendation } from "@/lib/agent/state";

interface PaymentApprovalCardProps {
  recommendation: Recommendation;
  onApprove: () => void;
  onEdit: () => void;
  isLoading?: boolean;
}

/** Parse "Trust Score 85/100 — ..." → 85 */
function parseTrustScore(reasoning: string): number | null {
  const match = reasoning.match(/Trust Score (\d+)\/100/);
  return match ? parseInt(match[1], 10) : null;
}

export function PaymentApprovalCard({
  recommendation,
  onApprove,
  onEdit,
  isLoading,
}: PaymentApprovalCardProps) {
  return (
    <div className="mx-4 my-3 overflow-hidden rounded-2xl border border-brand-gold-pale bg-brand-gold-ghost shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-green-deep to-brand-green-mid px-5 py-4">
        <h3 className="text-lg font-bold text-white">
          ✅ Konfirmasi Pembayaran
        </h3>
        <p className="mt-1 text-sm text-brand-green-ghost">
          Pastikan alokasi donasi sudah sesuai sebelum melanjutkan
        </p>
      </div>

      {/* Allocations */}
      <div className="divide-y divide-ink-ghost px-5 py-3">
        {recommendation.allocations.map((alloc, idx) => {
          const trustScore = parseTrustScore(alloc.reasoning);
          return (
            <div key={alloc.campaignId} className="py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-black">
                    {idx + 1}. {alloc.campaignName}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-mid">
                    {alloc.reasoning}
                  </p>
                  {trustScore !== null && (
                    <div className="mt-2">
                      <TrustScoreBar score={trustScore} />
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-brand-green-deep">
                    {formatRupiah(alloc.amount)}
                  </p>
                  {alloc.percentage > 0 && (
                    <p className="text-xs text-ink-mid">{alloc.percentage}%</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="border-t border-brand-gold-pale bg-brand-gold-ghost/50 px-5 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-dark">
            Total Pembayaran
          </span>
          <span className="text-lg font-bold text-brand-green-deep">
            {formatRupiah(recommendation.totalAmount)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-5 py-4">
        <Button
          size="lg"
          className="flex-1"
          onClick={onApprove}
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          💳 Bayar Sekarang
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={onEdit}
          disabled={isLoading}
        >
          ✏️ Ubah
        </Button>
      </div>

      {/* Islamic Context */}
      {recommendation.islamicContext && (
        <div className="border-t border-brand-gold-pale px-5 py-3">
          <p className="text-xs italic text-ink-mid">
            📖 {recommendation.islamicContext}
          </p>
        </div>
      )}
    </div>
  );
}
