import { cn } from "@/lib/utils";

interface RamadhanHeatmapProps {
  data: Array<{
    day: number;
    donated: boolean;
    amount: number;
  }>;
  streak: number;
}

export function RamadhanHeatmap({
  data,
  streak,
}: RamadhanHeatmapProps) {
  // 30 days of Ramadhan
  const days = Array.from({ length: 30 }, (_, i) => {
    const dayData = data.find((d) => d.day === i + 1);
    return {
      day: i + 1,
      donated: dayData?.donated ?? false,
      amount: dayData?.amount ?? 0,
    };
  });

  return (
    <div className="rounded-xl border border-ink-ghost bg-surface-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ink-black">
            🌙 Ramadhan Giving Journey
          </h3>
          <p className="text-xs text-ink-mid mt-0.5">
            Track donasi harian selama Ramadhan 1447H
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-brand-gold-core">{streak}🔥</p>
          <p className="text-xs text-ink-mid">hari berturut-turut</p>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-6 gap-1 sm:grid-cols-10 sm:gap-1.5">
        {days.map((day) => (
          <div
            key={day.day}
            className={cn(
              "flex h-7 w-full items-center justify-center rounded-md text-[10px] font-medium transition-all sm:h-8 sm:text-xs",
              day.donated
                ? "bg-brand-green-deep text-white shadow-sm"
                : "bg-ink-ghost/50 text-ink-light",
            )}
            title={
              day.donated
                ? `Hari ${day.day}: Donasi Rp ${day.amount.toLocaleString("id-ID")}`
                : `Hari ${day.day}: Belum berdonasi`
            }
          >
            {day.day}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs text-ink-mid">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-brand-green-deep" />
          <span>Berdonasi</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-ink-ghost/50" />
          <span>Belum</span>
        </div>
      </div>
    </div>
  );
}
