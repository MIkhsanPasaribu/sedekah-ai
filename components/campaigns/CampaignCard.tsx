import Link from "next/link";
import { formatRupiah, hitungPersentase } from "@/lib/utils";
import { TrustScoreBadge } from "@/components/shared/TrustScoreBadge";
import { Card, CardContent } from "@/components/ui/card";

interface CampaignCardProps {
  id: string;
  name: string;
  description: string;
  laz: string;
  lazVerified: boolean;
  targetAmount: number;
  collectedAmount: number;
  trustScore: number;
  category: string;
  region: string;
}

const CATEGORY_EMOJI: Record<string, string> = {
  yatim: "👦",
  bencana: "🆘",
  kesehatan: "🏥",
  pendidikan: "📚",
  pangan: "🍚",
};

const CATEGORY_LABEL: Record<string, string> = {
  yatim: "Yatim",
  bencana: "Bencana",
  kesehatan: "Kesehatan",
  pendidikan: "Pendidikan",
  pangan: "Pangan",
};

export function CampaignCard({
  id,
  name,
  description,
  laz,
  lazVerified,
  targetAmount,
  collectedAmount,
  trustScore,
  category,
  region,
}: CampaignCardProps) {
  const percentage = hitungPersentase(collectedAmount, targetAmount);

  return (
    <Link href={`/campaigns/${id}`}>
      <Card className="overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        {/* Category Banner */}
        <div className="flex items-center justify-between bg-brand-green-ghost px-4 py-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{CATEGORY_EMOJI[category] ?? "💚"}</span>
            <span className="text-xs font-medium text-brand-green-deep">
              {CATEGORY_LABEL[category] ?? category}
            </span>
          </div>
          <TrustScoreBadge score={trustScore} size="sm" />
        </div>

        <CardContent>
          {/* Title */}
          <h3 className="text-sm font-bold text-ink-black line-clamp-2">
            {name}
          </h3>

          {/* Description */}
          <p className="mt-1 text-xs text-ink-mid line-clamp-2">
            {description}
          </p>

          {/* LAZ */}
          <div className="mt-2 flex items-center gap-1">
            <span className="text-xs text-ink-mid">{laz}</span>
            {lazVerified && (
              <span
                className="text-xs text-brand-green-light"
                title="Terverifikasi"
              >
                ✓
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-brand-green-deep">
                {formatRupiah(collectedAmount)}
              </span>
              <span className="text-ink-light">
                dari {formatRupiah(targetAmount)}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-ghost">
              <div
                className="h-full rounded-full bg-brand-green-pale transition-all duration-500"
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-ink-mid">
                {percentage}% terkumpul
              </span>
              <span className="text-[10px] text-ink-mid">📍 {region}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
