import { formatRupiah } from "@/lib/utils";
import type { ZakatBreakdown } from "@/lib/agent/state";

interface ZakatBreakdownCardProps {
  breakdown: ZakatBreakdown;
}

interface ZakatRow {
  label: string;
  emoji: string;
  amount: number;
}

export function ZakatBreakdownCard({ breakdown }: ZakatBreakdownCardProps) {
  const rows: ZakatRow[] = [
    {
      label: "Zakat Penghasilan",
      emoji: "💰",
      amount: breakdown.zakatPenghasilan,
    },
    { label: "Zakat Tabungan", emoji: "🏦", amount: breakdown.zakatTabungan },
    { label: "Zakat Emas", emoji: "✨", amount: breakdown.zakatEmas },
    { label: "Zakat Saham", emoji: "📈", amount: breakdown.zakatSaham },
    { label: "Zakat Crypto", emoji: "🪙", amount: breakdown.zakatCrypto },
    { label: "Zakat Fitrah", emoji: "🍚", amount: breakdown.zakatFitrah },
  ].filter((r) => r.amount > 0);

  return (
    <div className="mx-4 my-3 overflow-hidden rounded-2xl border border-brand-green-pale bg-gradient-to-b from-brand-green-ghost to-white shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-green-deep to-brand-green-mid px-5 py-3">
        <h3 className="text-base font-bold text-white">
          🧮 Hasil Kalkulasi Zakat
        </h3>
        <p className="mt-0.5 text-xs text-brand-green-ghost">
          Nisab 2026: 85g emas = Rp 85.000.000 | Tarif 2.5%
        </p>
      </div>

      {/* Rows */}
      {rows.length > 0 ? (
        <div className="divide-y divide-brand-green-ghost/50 px-5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5"
            >
              <span className="flex items-center gap-2 text-sm text-ink-dark">
                <span>{row.emoji}</span>
                {row.label}
              </span>
              <span className="text-sm font-semibold text-brand-green-deep">
                {formatRupiah(row.amount)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-5 py-4 text-sm text-ink-mid">
          Harta Anda belum mencapai nisab. Tidak ada kewajiban zakat mal saat
          ini. 🤲
        </p>
      )}

      {/* Total */}
      <div className="flex items-center justify-between bg-brand-green-ghost/60 px-5 py-3">
        <span className="text-sm font-bold text-ink-black">
          ✅ Total Kewajiban
        </span>
        <span className="text-base font-bold text-brand-green-deep">
          {formatRupiah(breakdown.totalKewajiban)}
        </span>
      </div>

      {/* Ayat */}
      <div className="border-t border-brand-green-ghost px-5 py-3">
        <p className="text-xs italic text-ink-mid">
          📖 QS At-Taubah (9:103): &ldquo;Ambillah zakat dari sebagian harta
          mereka, dengan zakat itu kamu membersihkan dan menyucikan
          mereka.&rdquo;
        </p>
      </div>
    </div>
  );
}
