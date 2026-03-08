import { cn } from "@/lib/utils";

interface FraudFlagWarningProps {
  flags: string[];
  score: number;
  className?: string;
}

const FLAG_LABELS: Record<string, string> = {
  narrative_manipulation:
    "Narasi mengandung manipulasi emosional berlebihan",
  financial_anomaly:
    "Anomali finansial — target dana tidak wajar atau rasio terlalu rendah",
  seasonal_pattern:
    "Pola musiman mencurigakan — kampanye hanya muncul saat Ramadhan",
  identity_unverified:
    "LAZ pengelola BELUM terverifikasi secara resmi",
};

export function FraudFlagWarning({
  flags,
  score,
  className,
}: FraudFlagWarningProps) {
  if (score >= 40 || flags.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-danger bg-danger-light px-4 py-3",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-base text-danger">⚠️</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-danger">
            Peringatan — Trust Score Rendah ({score}/100)
          </p>
          <ul className="mt-1.5 space-y-1">
            {flags.map((flag) => (
              <li key={flag} className="flex items-start gap-1.5 text-xs text-danger">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{FLAG_LABELS[flag] ?? flag}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink-mid">
            Kami menyarankan untuk mencari kampanye lain yang lebih terpercaya.
            Keselamatan donasi Anda adalah prioritas kami. 🤲
          </p>
        </div>
      </div>
    </div>
  );
}
