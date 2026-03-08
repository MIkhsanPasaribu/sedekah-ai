"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Loading spinner dengan nuansa dzikir — digunakan saat menunggu proses pembayaran.
 */
export function DzikirLoader({ className }: { className?: string }) {
  const dzikirTexts = [
    "سُبْحَانَ اللَّهِ",
    "الْحَمْدُ لِلَّهِ",
    "اللَّهُ أَكْبَرُ",
    "لَا إِلَهَ إِلَّا اللَّهُ",
  ];

  const [index] = useState(() =>
    Math.floor(Math.random() * dzikirTexts.length),
  );

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-8",
        className,
      )}
    >
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-brand-gold-pale animate-spin-arabesque" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🕌</span>
        </div>
      </div>
      <div className="text-center">
        <p className="arabic-text text-lg text-brand-green-deep">
          {dzikirTexts[index]}
        </p>
        <p className="mt-1 text-sm text-ink-mid">
          Sedang memproses donasi Anda...
        </p>
      </div>
    </div>
  );
}
