"use client";

import Image from "next/image";

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
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-gold-pale">
          <Image
            src="/images/logo.png"
            alt="SEDEKAH.AI"
            width={40}
            height={40}
            className="rounded-lg"
          />
        </div>
        <h3 className="text-xl font-heading font-semibold text-ink-black">
          Assalamu&apos;alaikum! 🌙
        </h3>
        <p className="mt-2 text-sm text-ink-mid">
          Saya Amil AI, siap membantu Anda berzakat dan bersedekah.
          <br className="hidden sm:block" />
          Pilih salah satu atau ketik langsung:
        </p>
      </div>

      <div className="mt-8 grid w-full max-w-xl grid-cols-2 gap-2.5 sm:grid-cols-3">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => onSelect(action.message)}
            className="flex items-center gap-2.5 rounded-xl border border-ink-ghost/60 bg-surface-white px-3.5 py-3 text-left transition-all hover:border-brand-green-light hover:bg-brand-green-ghost/50 hover:shadow-sm"
          >
            <span className="text-lg">{action.emoji}</span>
            <span className="text-sm font-medium text-ink-dark">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
