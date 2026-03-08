import { formatRupiah, hitungPersentase } from "@/lib/utils";
import { TrustScoreBar } from "@/components/shared/TrustScoreBadge";
import { Button } from "@/components/shared/Button";
import { Shield, MapPin, Building2, Calendar } from "lucide-react";
import Link from "next/link";

interface CampaignDetailCardProps {
  id: string;
  name: string;
  description: string;
  laz: string;
  lazVerified: boolean;
  targetAmount: number;
  collectedAmount: number;
  trustScore: number;
  trustBreakdown: Record<string, number> | null;
  category: string;
  region: string;
  endsAt: string | null;
  fraudFlags: Array<{
    flagType: string;
    description: string;
    severity: string;
  }>;
}

export function CampaignDetailCard({
  id,
  name,
  description,
  laz,
  lazVerified,
  targetAmount,
  collectedAmount,
  trustScore,
  trustBreakdown,
  category,
  region,
  endsAt,
  fraudFlags,
}: CampaignDetailCardProps) {
  const percentage = hitungPersentase(collectedAmount, targetAmount);
  const gapAmount = targetAmount - collectedAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-ink-ghost bg-surface-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <span className="inline-block rounded-full bg-brand-green-ghost px-3 py-1 text-xs font-medium text-brand-green-deep capitalize">
              {category}
            </span>
            <h1 className="mt-2 text-xl font-bold text-ink-black">{name}</h1>
          </div>
        </div>

        <p className="mt-3 text-sm text-ink-dark leading-relaxed">
          {description}
        </p>

        {/* Meta info */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-mid">
          <div className="flex items-center gap-1.5">
            <Building2 className="h-4 w-4" />
            <span>
              {laz}{" "}
              {lazVerified && (
                <span className="text-brand-green-light font-medium">
                  ✓ Terverifikasi
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{region}</span>
          </div>
          {endsAt && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>
                Berakhir:{" "}
                {new Date(endsAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-2xl font-bold text-brand-green-deep">
                {formatRupiah(collectedAmount)}
              </p>
              <p className="text-xs text-ink-mid">
                terkumpul dari {formatRupiah(targetAmount)}
              </p>
            </div>
            <p className="text-sm font-semibold text-ink-mid">{percentage}%</p>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-ink-ghost">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-green-deep to-brand-green-light transition-all duration-700"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-ink-mid">
            Kekurangan: {formatRupiah(Math.max(0, gapAmount))}
          </p>
        </div>

        {/* CTA */}
        <div className="mt-5 flex gap-3">
          <Link href="/chat" className="flex-1">
            <Button variant="primary" size="lg" className="w-full">
              💚 Donasi via AI Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Trust Score */}
      <div className="rounded-2xl border border-ink-ghost bg-surface-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-brand-green-deep" />
          <h2 className="text-base font-bold text-ink-black">
            Fraud Shield AI — Trust Score
          </h2>
        </div>

        <TrustScoreBar score={trustScore} className="mb-4" />

        {/* Breakdown */}
        {trustBreakdown && (
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(trustBreakdown).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-surface-warm p-3">
                <p className="text-xs text-ink-mid capitalize">
                  {key.replace(/_/g, " ")}
                </p>
                <p className="text-lg font-bold text-ink-black">{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Fraud Flags */}
        {fraudFlags.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-danger mb-2">
              ⚠️ Peringatan ({fraudFlags.length})
            </p>
            <div className="space-y-2">
              {fraudFlags.map((flag, idx) => (
                <div
                  key={idx}
                  className="rounded-lg bg-danger-light p-3 text-xs text-danger"
                >
                  <span className="font-medium capitalize">
                    {flag.flagType.replace(/_/g, " ")}
                  </span>
                  {" — "}
                  {flag.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
