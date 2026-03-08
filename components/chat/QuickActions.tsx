"use client";

interface QuickActionsProps {
  onSelect: (action: string) => void;
}

const QUICK_ACTIONS = [
  {
    emoji: "🧮",
    label: "Hitung Zakat",
    message: "Saya ingin menghitung zakat mal saya",
  },
  {
    emoji: "🤲",
    label: "Sedekah",
    message: "Saya ingin bersedekah",
  },
  {
    emoji: "👦",
    label: "Bantu Yatim",
    message: "Saya ingin berdonasi untuk anak yatim",
  },
  {
    emoji: "🆘",
    label: "Bencana",
    message: "Saya ingin membantu korban bencana",
  },
  {
    emoji: "📚",
    label: "Pendidikan",
    message: "Saya ingin berdonasi untuk pendidikan",
  },
  {
    emoji: "🍚",
    label: "Zakat Fitrah",
    message: "Saya ingin membayar zakat fitrah",
  },
];

export function QuickActions({ onSelect }: QuickActionsProps) {
  return (
    <div className="px-4 py-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-ink-black">
          Assalamu&apos;alaikum! 👋
        </h3>
        <p className="mt-1 text-sm text-ink-mid">
          Saya Amil AI, siap membantu Anda berzakat dan bersedekah.
          <br />
          Pilih salah satu atau ketik langsung:
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.message)}
            className="flex items-center gap-2 rounded-xl border border-ink-ghost bg-surface-white px-3 py-3 text-left transition-all hover:border-brand-green-light hover:bg-brand-green-ghost hover:shadow-sm"
          >
            <span className="text-xl">{action.emoji}</span>
            <span className="text-sm font-medium text-ink-dark">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
