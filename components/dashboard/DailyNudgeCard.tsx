"use client";

import Link from "next/link";

interface DailyNudgeCardProps {
  ramadhanDay: number;
  donatedToday: boolean;
  nudgeMessage: string;
  streak: number;
}

export function DailyNudgeCard({
  ramadhanDay,
  donatedToday,
  nudgeMessage,
  streak,
}: DailyNudgeCardProps) {
  const phase =
    ramadhanDay <= 10
      ? "Rahmat"
      : ramadhanDay <= 20
        ? "Maghfirah"
        : "Pembebasan dari Api Neraka";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-gold-pale bg-linear-to-br from-brand-gold-ghost via-white to-brand-green-ghost p-5 shadow-sm">
      {/* decorative crescent */}
      <div className="pointer-events-none absolute -right-6 -top-6 text-[80px] opacity-10 select-none">
        🌙
      </div>

      <div className="flex items-start gap-4">
        {/* Day badge */}
        <div className="flex shrink-0 flex-col items-center rounded-xl bg-brand-green-deep px-3 py-2 text-white shadow">
          <span className="text-[10px] uppercase tracking-wide opacity-80">
            Hari
          </span>
          <span className="font-heading text-2xl font-bold leading-none">
            {ramadhanDay}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          {/* Phase label */}
          <p className="text-xs font-medium text-brand-gold-deep">
            Fase {phase} — Ramadhan 1447 H
          </p>

          {/* Nudge message */}
          <p className="mt-1.5 text-sm leading-relaxed text-ink-dark">
            {nudgeMessage}
          </p>

          {/* Status row */}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {donatedToday ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-light px-2.5 py-0.5 text-xs font-medium text-success">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                Sudah bersedekah hari ini
              </span>
            ) : (
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 rounded-full bg-brand-green-deep px-3 py-1 text-xs font-medium text-white hover:bg-brand-green-mid transition"
              >
                Sedekah Sekarang &rarr;
              </Link>
            )}

            {streak > 0 && (
              <span className="text-xs text-ink-mid">
                🔥 Streak {streak} hari
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
