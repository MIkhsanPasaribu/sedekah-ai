import { cn } from "@/lib/utils";

interface MilestoneBadge {
  id: string;
  label: string;
  emoji: string;
  achieved: boolean;
  description: string;
}

interface MilestoneGridProps {
  badges: MilestoneBadge[];
}

const DEFAULT_BADGES: MilestoneBadge[] = [
  {
    id: "first-zakat",
    label: "Zakat Pertama",
    emoji: "🌟",
    achieved: false,
    description: "Menunaikan zakat pertama Anda",
  },
  {
    id: "streak-7",
    label: "7 Hari Streak",
    emoji: "🔥",
    achieved: false,
    description: "7 hari berturut-turut berdonasi",
  },
  {
    id: "million-club",
    label: "Jutawan Amal",
    emoji: "💎",
    achieved: false,
    description: "Total donasi mencapai Rp 1.000.000",
  },
  {
    id: "five-campaigns",
    label: "Penjelajah Amal",
    emoji: "🗺️",
    achieved: false,
    description: "Berdonasi ke 5+ kampanye berbeda",
  },
  {
    id: "ramadhan-complete",
    label: "Khatam Ramadhan",
    emoji: "🌙",
    achieved: false,
    description: "30 hari penuh berdonasi di Ramadhan",
  },
  {
    id: "impact-hero",
    label: "Pahlawan Dampak",
    emoji: "🏆",
    achieved: false,
    description: "100+ penerima manfaat terbantu",
  },
];

export function MilestoneGrid({ badges }: MilestoneGridProps) {
  const displayBadges = badges.length > 0 ? badges : DEFAULT_BADGES;

  return (
    <div className="rounded-xl border border-ink-ghost bg-surface-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink-black mb-3">
        🏅 Prestasi Ramadhan
      </h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {displayBadges.map((badge) => (
          <div
            key={badge.id}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl p-3 text-center transition-all",
              badge.achieved
                ? "bg-brand-gold-ghost border border-brand-gold-pale"
                : "bg-ink-ghost/30 opacity-50",
            )}
          >
            <span className="text-2xl">{badge.emoji}</span>
            <span className="text-xs font-semibold text-ink-dark line-clamp-1">
              {badge.label}
            </span>
            <span className="text-[10px] text-ink-mid line-clamp-2">
              {badge.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DEFAULT_BADGES };
export type { MilestoneBadge };
