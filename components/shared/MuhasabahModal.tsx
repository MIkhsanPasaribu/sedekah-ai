"use client";

import { useState, useEffect, useCallback } from "react";

interface MuhasabahModalProps {
  /** Modal ditampilkan ketika `open` berubah jadi true */
  open: boolean;
  onClose: () => void;
}

const REFLECTIONS = [
  {
    ayat: "إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ",
    translation:
      "Sesungguhnya Allah tidak menyia-nyiakan pahala orang-orang yang berbuat baik.",
    reference: "QS. At-Taubah: 120",
    question:
      "Siapa dalam hidup Anda yang paling ingin Anda bantu jika bisa?",
  },
  {
    ayat: "وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ",
    translation:
      "Dan kebaikan apa saja yang kamu kerjakan untuk dirimu, niscaya kamu akan mendapatkannya di sisi Allah.",
    reference: "QS. Al-Baqarah: 110",
    question:
      "Apa yang Anda rasakan saat ini setelah berbagi dengan sesama?",
  },
  {
    ayat: "مَن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ أَضْعَافًا كَثِيرَةً",
    translation:
      "Siapakah yang mau memberi pinjaman kepada Allah, pinjaman yang baik, maka Allah akan melipat gandakan.",
    reference: "QS. Al-Baqarah: 245",
    question:
      "Jika ada satu perubahan yang ingin Anda wujudkan lewat donasi, apa itu?",
  },
  {
    ayat: "لَن تَنَالُوا الْبِرَّ حَتَّىٰ تُنفِقُوا مِمَّا تُحِبُّونَ",
    translation:
      "Kamu sekali-kali tidak sampai kepada kebajikan, sebelum kamu menafkahkan sebagian harta yang kamu cintai.",
    reference: "QS. Ali Imran: 92",
    question:
      "Apa hal kecil yang bisa Anda lakukan besok untuk meneruskan kebaikan ini?",
  },
];

/** Auto-close timer: 30 detik */
const AUTO_CLOSE_MS = 30_000;

export function MuhasabahModal({ open, onClose }: MuhasabahModalProps) {
  const [reflection] = useState(
    () => REFLECTIONS[Math.floor(Math.random() * REFLECTIONS.length)],
  );
  const [progress, setProgress] = useState(100);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Auto-close countdown
  useEffect(() => {
    if (!open) return;

    const start = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleClose();
      }
    }, 200);

    return () => clearInterval(timer);
  }, [open, handleClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-surface-white shadow-xl">
        {/* Progress bar */}
        <div className="h-1 bg-ink-ghost">
          <div
            className="h-full bg-brand-gold-core transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          <p className="text-3xl">🤲</p>
          <p className="mt-3 text-sm font-semibold text-ink-mid">
            Sejenak Bermuhasabah...
          </p>

          {/* Ayat */}
          <div className="mt-4 rounded-xl border border-brand-gold-pale bg-brand-gold-ghost p-4">
            <p className="arabic-text text-lg leading-relaxed text-brand-gold-deep">
              {reflection.ayat}
            </p>
            <p className="mt-2 text-sm italic text-ink-dark">
              &ldquo;{reflection.translation}&rdquo;
            </p>
            <p className="mt-1 text-xs text-ink-light">
              — {reflection.reference}
            </p>
          </div>

          {/* Reflective question */}
          <p className="mt-4 text-sm font-medium text-ink-dark">
            {reflection.question}
          </p>
        </div>

        {/* Close */}
        <div className="border-t border-ink-ghost px-6 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg bg-brand-green-deep py-2.5 text-sm font-medium text-white transition hover:bg-brand-green-mid"
          >
            Lanjutkan ✨
          </button>
        </div>
      </div>
    </div>
  );
}
