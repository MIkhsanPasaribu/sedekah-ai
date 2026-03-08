"use client";

const STEPS = [
  { node: "INTAKE", label: "Niat", icon: "🤲" },
  { node: "CALCULATE", label: "Hitung", icon: "🧮" },
  { node: "RESEARCH", label: "Riset", icon: "🔍" },
  { node: "FRAUD_DETECTOR", label: "Keamanan", icon: "🛡️" },
  { node: "RECOMMEND", label: "Rekomendasi", icon: "💡" },
  { node: "PAYMENT_EXECUTOR", label: "Bayar", icon: "💳" },
  { node: "IMPACT_TRACKER", label: "Dampak", icon: "📊" },
];

/** Map the user-facing label back to a node name index */
const LABEL_TO_INDEX: Record<string, number> = {
  "Memahami niat Anda...": 0,
  "Menghitung zakat...": 1,
  "Mencari kampanye terpercaya...": 2,
  "Menganalisis keamanan...": 3,
  "Menyusun rekomendasi...": 4,
  "Menunggu konfirmasi Anda...": 4,
  "Memproses pembayaran...": 5,
  "Menyiapkan laporan dampak...": 6,
};

interface AgentProgressBarProps {
  /** The current node label from SSE (e.g. "Memahami niat Anda...") */
  currentLabel: string | null;
}

export function AgentProgressBar({ currentLabel }: AgentProgressBarProps) {
  if (!currentLabel) return null;

  const activeIdx = LABEL_TO_INDEX[currentLabel] ?? -1;

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm w-fit">
      <div className="flex items-center gap-1">
        {STEPS.map((step, i) => {
          const isCompleted = i < activeIdx;
          const isActive = i === activeIdx;

          return (
            <div key={step.node} className="flex items-center">
              {/* Step dot / icon */}
              <div
                className={`flex items-center justify-center rounded-full text-xs transition-all duration-300 ${
                  isActive
                    ? "h-7 w-7 bg-brand-green-deep text-white shadow-md ring-2 ring-brand-green-pale"
                    : isCompleted
                      ? "h-6 w-6 bg-brand-green-pale text-brand-green-deep"
                      : "h-6 w-6 bg-ink-ghost/40 text-ink-light"
                }`}
                title={step.label}
              >
                {isCompleted ? "✓" : step.icon}
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-0.5 h-0.5 w-4 rounded transition-colors duration-300 ${
                    i < activeIdx ? "bg-brand-green-pale" : "bg-ink-ghost/30"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Active label */}
      <span className="ml-1 text-sm text-ink-mid">{currentLabel}</span>
    </div>
  );
}
