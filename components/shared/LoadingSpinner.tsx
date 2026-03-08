"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  message?: string;
}

const SIZES = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function LoadingSpinner({
  size = "md",
  className,
  message,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        className,
      )}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-brand-green-pale border-t-brand-green-deep",
          SIZES[size],
        )}
      />
      {message && (
        <p className="text-sm text-ink-mid animate-pulse">{message}</p>
      )}
    </div>
  );
}

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
