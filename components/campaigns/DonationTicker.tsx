"use client";

import { useState, useEffect, useRef } from "react";
import { formatRupiah } from "@/lib/utils";

interface RecentDonation {
  name: string;
  amount: number;
  createdAt: string;
}

interface DonationTickerProps {
  campaignId: string;
}

export function DonationTicker({ campaignId }: DonationTickerProps) {
  const [donations, setDonations] = useState<RecentDonation[]>([]);
  const [total, setTotal] = useState(0);
  const [newId, setNewId] = useState<number | null>(null);
  const prevRef = useRef<RecentDonation[]>([]);

  async function fetchRecent(): Promise<void> {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/recent`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      const incoming: RecentDonation[] = data.donations ?? [];

      // Detect new entry
      if (
        incoming.length > 0 &&
        prevRef.current.length > 0 &&
        incoming[0].createdAt !== prevRef.current[0]?.createdAt
      ) {
        setNewId(Date.now());
        setTimeout(() => setNewId(null), 1500);
      }

      prevRef.current = incoming;
      setDonations(incoming);

      // Re-fetch total count from all paid donations
      setTotal(data.total ?? incoming.length);
    } catch {
      // silent — ticker is non-critical
    }
  }

  useEffect(() => {
    fetchRecent();
    const interval = setInterval(fetchRecent, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  if (donations.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-brand-green-pale bg-brand-green-ghost px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-brand-green-deep">
          🔴 Donasi Terkini
        </p>
        {total > 0 && (
          <span className="text-xs text-ink-mid">{total} donatur</span>
        )}
      </div>
      <div className="space-y-1.5">
        {donations.slice(0, 5).map((d, idx) => (
          <div
            key={`${d.createdAt}-${idx}`}
            className={
              idx === 0 && newId !== null
                ? "flex items-center justify-between text-xs animate-fade-in"
                : "flex items-center justify-between text-xs"
            }
          >
            <span className="font-medium text-ink-dark">{d.name}</span>
            <span className="font-bold text-brand-green-deep">
              {formatRupiah(d.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
