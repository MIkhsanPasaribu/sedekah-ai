"use client";

import { cn } from "@/lib/utils";

interface StreakCounterProps {
  streak: number;
  longestStreak?: number;
  ramadhanDay?: number;
}

const STREAK_TIERS = [
  { min: 30, label: "Khatam Ramadhan! 🏆", color: "text-brand-gold-core" },
  { min: 21, label: "Pejuang Akhir! 🌟", color: "text-brand-gold-core" },
  { min: 14, label: "Konsisten! 💎", color: "text-brand-green-light" },
  { min: 7, label: "Seminggu Penuh! 🔥", color: "text-brand-green-mid" },
  { min: 3, label: "Momentum! ✨", color: "text-brand-green-mid" },
  { min: 1, label: "Langkah Pertama 💚", color: "text-brand-green-deep" },
  { min: 0, label: "Mulai Hari Ini", color: "text-ink-mid" },
] as const;

function getStreakTier(streak: number): (typeof STREAK_TIERS)[number] {
  return STREAK_TIERS.find((t) => streak >= t.min) ?? STREAK_TIERS[STREAK_TIERS.length - 1];
}

export function StreakCounter({
  streak,
  longestStreak,
  ramadhanDay,
}: StreakCounterProps) {
  const tier = getStreakTier(streak);
  const progress = ramadhanDay ? Math.round((streak / ramadhanDay) * 100) : 0;

  return (
    <div className="rounded-xl border border-ink-ghost bg-surface-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink-black mb-3">
        🔥 Streak Ramadhan
      </h3>

      {/* Main streak display */}
      <div className="flex items-center gap-4">
        {/* Fire ring */}
        <div
          className={cn(
            "relative flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full",
            streak > 0
              ? "bg-gradient-to-br from-brand-gold-ghost to-brand-gold-pale"
              : "bg-ink-ghost/30",
          )}
        >
          <span className="text-3xl font-bold text-brand-gold-deep">
            {streak}
          </span>
          {streak > 0 && (
            <span className="absolute -right-1 -top-1 text-lg">🔥</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", tier.color)}>
            {tier.label}
          </p>
          <p className="text-xs text-ink-mid mt-0.5">
            hari berturut-turut berdonasi
          </p>

          {/* Progress bar — konsistensi */}
          {ramadhanDay && ramadhanDay > 0 ? (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[10px] text-ink-mid mb-1">
                <span>Konsistensi</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-ghost/30">
                <div
                  className="h-full rounded-full bg-brand-green-deep transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Longest streak */}
      {longestStreak !== undefined && longestStreak > streak && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-mid">
          <span>⭐</span>
          <span>Rekor terpanjang: {longestStreak} hari</span>
        </div>
      )}

      {/* Next milestone */}
      {streak > 0 && streak < 30 && (
        <div className="mt-3 rounded-lg bg-brand-gold-ghost px-3 py-2">
          <p className="text-xs text-brand-gold-deep">
            {streak < 7
              ? `🎯 ${7 - streak} hari lagi menuju milestone 7 Hari Streak!`
              : streak < 14
                ? `🎯 ${14 - streak} hari lagi menuju 2 Minggu Berturut-turut!`
                : streak < 21
                  ? `🎯 ${21 - streak} hari lagi menuju 3 Minggu!`
                  : `🎯 ${30 - streak} hari lagi menuju Khatam Ramadhan!`}
          </p>
        </div>
      )}
    </div>
  );
}
