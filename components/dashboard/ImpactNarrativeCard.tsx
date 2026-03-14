"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface ImpactNarrativeCardProps {
  donationId: string;
}

export function ImpactNarrativeCard({ donationId }: ImpactNarrativeCardProps) {
  const [narrative, setNarrative] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadNarrative() {
    if (narrative || isLoading) return;
    setIsLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/impact/narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donationId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNarrative(data.narrative ?? null);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }

  if (narrative) {
    return (
      <div className="rounded-xl border border-brand-gold-pale bg-brand-gold-ghost px-5 py-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-gold-core" />
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-gold-deep">
            Kisah Dampak Donasi Anda
          </p>
        </div>
        <div className="space-y-3">
          {narrative.split("\n\n").map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-ink-dark">
              {para}
            </p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={loadNarrative}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand-gold-pale bg-brand-gold-ghost py-3 text-sm font-semibold text-brand-gold-deep transition hover:bg-brand-gold-pale disabled:opacity-60"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Membuat kisah dampak...
        </>
      ) : error ? (
        "Coba lagi"
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          Lihat Kisah Dampak Donasi Anda ✨
        </>
      )}
    </button>
  );
}
