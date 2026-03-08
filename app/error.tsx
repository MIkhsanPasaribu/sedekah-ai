"use client";

import { useEffect } from "react";
import { Button } from "@/components/shared/Button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({
  error,
  reset,
}: ErrorPageProps) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-warm px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-5xl">😔</p>
        <h1 className="mt-4 text-xl font-bold text-ink-black">
          Astaghfirullah, terjadi kesalahan
        </h1>
        <p className="mt-2 text-sm text-ink-mid">
          Sepertinya ada yang tidak berjalan dengan baik. Kami mohon maaf atas
          ketidaknyamanannya.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="primary" onClick={reset}>
            Coba Lagi
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
          >
            Ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
