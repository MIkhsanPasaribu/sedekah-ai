import { formatRupiah, getCategoryEmoji } from "@/lib/utils";
import type { ImpactReport } from "@/lib/agent/state";

interface ImpactCardProps {
  report: ImpactReport;
}

export function ImpactCard({ report }: ImpactCardProps) {
  return (
    <div className="mx-4 my-3 overflow-hidden rounded-2xl border border-brand-green-pale bg-gradient-to-b from-brand-green-ghost to-white shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-green-deep to-brand-green-mid px-5 py-4">
        <h3 className="text-lg font-bold text-white">
          📊 Laporan Dampak Donasi
        </h3>
        <div className="mt-2 flex items-center gap-4">
          <div>
            <p className="text-xs text-brand-green-ghost">Total Donasi</p>
            <p className="text-lg font-bold text-white">
              {formatRupiah(report.totalDonated)}
            </p>
          </div>
          <div className="h-8 w-px bg-brand-green-mid" />
          <div>
            <p className="text-xs text-brand-green-ghost">Impact Score</p>
            <p className="text-lg font-bold text-brand-gold-core">
              {report.impactScore}/100
            </p>
          </div>
        </div>
      </div>

      {/* Impact Items */}
      <div className="divide-y divide-brand-green-ghost/50 px-5">
        {report.items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 py-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-green-ghost text-sm">
              {getCategoryEmoji(item.category)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink-black">
                  {item.category}
                </p>
                <p className="text-sm font-bold text-brand-green-deep">
                  {formatRupiah(item.amount)}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-ink-mid">
                → {item.description}
              </p>
              <p className="text-xs text-brand-green-mid">
                {item.beneficiaries} penerima manfaat
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Reflection */}
      <div className="border-t border-brand-green-ghost/50 px-5 py-4">
        <p className="text-sm text-ink-dark leading-relaxed">
          🤲 {report.reflectionMessage}
        </p>
        <p className="mt-2 text-xs italic text-ink-mid">📖 {report.ayat}</p>
      </div>
    </div>
  );
}
