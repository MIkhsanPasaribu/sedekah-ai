"use client";

import { useEffect } from "react";

interface AdminErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: AdminErrorProps) {
  useEffect(() => {
    console.error("[Admin Error]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-surface-warm px-4 text-center">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-ink-black">Terjadi Kesalahan</h2>
        <p className="text-sm text-ink-mid">
          Terjadi masalah pada halaman admin. Silakan coba lagi.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-ink-light">
            Kode: {error.digest}
          </p>
        )}
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-brand-green-deep px-6 py-2 text-sm font-semibold text-white hover:bg-brand-green-mid"
      >
        Coba Lagi
      </button>
    </div>
  );
}
