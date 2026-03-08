import { formatRupiah, getCategoryEmoji } from "@/lib/utils";

interface ImpactSummaryProps {
  totalDonated: number;
  totalBeneficiaries: number;
  impactScore: number;
  categories: Array<{
    name: string;
    amount: number;
    percentage: number;
    beneficiaries: number;
  }>;
}

export function ImpactSummary({
  totalDonated,
  totalBeneficiaries,
  impactScore,
  categories,
}: ImpactSummaryProps) {
  return (
    <div className="rounded-xl border border-ink-ghost bg-surface-white shadow-sm overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-brand-green-deep to-brand-green-mid px-5 py-4">
        <h3 className="text-base font-bold text-white">
          📊 Impact Genome — ROI Amal Anda
        </h3>
        <div className="mt-3 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-brand-green-ghost">Total Donasi</p>
            <p className="text-lg font-bold text-white">
              {formatRupiah(totalDonated)}
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-green-ghost">Penerima Manfaat</p>
            <p className="text-lg font-bold text-brand-gold-core">
              {totalBeneficiaries.toLocaleString("id-ID")}
            </p>
          </div>
          <div>
            <p className="text-xs text-brand-green-ghost">Impact Score</p>
            <p className="text-lg font-bold text-brand-gold-bright">
              {impactScore}/100
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="px-5 py-4">
        <p className="text-xs font-medium text-ink-mid mb-3">
          Distribusi per Kategori
        </p>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-ink-dark">
                  {getCategoryEmoji(cat.name)} {cat.name}
                </span>
                <span className="text-sm font-bold text-brand-green-deep">
                  {formatRupiah(cat.amount)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-ghost">
                <div
                  className="h-full rounded-full bg-brand-green-light transition-all duration-500"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
              <p className="mt-0.5 text-xs text-ink-mid">
                {cat.beneficiaries} penerima manfaat ({cat.percentage}%)
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
