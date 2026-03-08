"use client";

import { cn } from "@/lib/utils";

interface IslamicLoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function IslamicLoadingSpinner({
  message = "Sedang memproses...",
  className,
}: IslamicLoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-8 text-center",
        className,
      )}
    >
      {/* Crescent + star animation */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand-green-ghost border-t-brand-green-deep" />
        <span className="text-2xl">🌙</span>
      </div>

      {/* Arabic text */}
      <p
        className="arabic-text text-lg text-brand-green-deep"
        dir="rtl"
        lang="ar"
      >
        بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
      </p>

      {/* Status message */}
      <p className="text-sm font-medium text-ink-mid">{message}</p>
    </div>
  );
}
