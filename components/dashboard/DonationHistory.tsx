import { formatRupiah, formatTanggal } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface DonationHistoryItem {
  id: string;
  amount: number;
  type: string;
  campaignName: string;
  status: "pending" | "paid" | "failed" | "expired";
  createdAt: string;
  islamicContext?: string | null;
}

interface DonationHistoryProps {
  donations: DonationHistoryItem[];
}

const STATUS_CONFIG = {
  pending: {
    label: "Menunggu",
    className: "bg-warning-light text-warning",
  },
  paid: {
    label: "Berhasil",
    className: "bg-success-light text-success",
  },
  failed: {
    label: "Gagal",
    className: "bg-danger-light text-danger",
  },
  expired: {
    label: "Kedaluwarsa",
    className: "bg-ink-ghost text-ink-mid",
  },
};

const TYPE_LABELS: Record<string, string> = {
  zakat_mal: "Zakat Mal",
  zakat_fitrah: "Zakat Fitrah",
  sedekah: "Sedekah",
  infaq: "Infaq",
  wakaf: "Wakaf",
};

export function DonationHistory({ donations }: DonationHistoryProps) {
  if (donations.length === 0) {
    return (
      <div className="rounded-xl border border-ink-ghost bg-surface-white p-8 text-center shadow-sm">
        <p className="text-4xl">🤲</p>
        <p className="mt-2 text-sm font-medium text-ink-mid">
          Belum ada riwayat donasi
        </p>
        <p className="mt-1 text-xs text-ink-light">
          Mulai perjalanan amal Anda hari ini
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-ghost bg-surface-white shadow-sm">
      <div className="border-b border-ink-ghost px-5 py-3">
        <h3 className="text-sm font-semibold text-ink-black">
          📋 Riwayat Donasi
        </h3>
      </div>
      <div className="divide-y divide-ink-ghost">
        {donations.map((donation) => {
          const status = STATUS_CONFIG[donation.status];
          return (
            <div key={donation.id} className="px-5 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-black">
                    {donation.campaignName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-xs text-ink-mid">
                      {TYPE_LABELS[donation.type] ?? donation.type}
                    </span>
                    <span className="text-xs text-ink-light">•</span>
                    <span className="text-xs text-ink-light">
                      {formatTanggal(new Date(donation.createdAt))}
                    </span>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-bold text-brand-green-deep">
                    {formatRupiah(donation.amount)}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </div>
              </div>
              {donation.islamicContext && (
                <p className="mt-1.5 text-xs italic text-ink-mid">
                  📖 {donation.islamicContext}
                </p>
              )}
              {/* Action links */}
              <div className="mt-2 flex items-center gap-3">
                <Link
                  href={`/dashboard/impact/${donation.id}`}
                  className="text-xs font-medium text-brand-green-deep hover:text-brand-green-mid underline underline-offset-2"
                >
                  Lihat dampak →
                </Link>
                {donation.status === "paid" && (
                  <a
                    href={`/api/donations/${donation.id}/certificate`}
                    download={`sertifikat-${donation.id.slice(0, 8)}.png`}
                    className="text-xs text-ink-mid hover:text-ink-dark underline underline-offset-2"
                  >
                    Unduh sertifikat
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
