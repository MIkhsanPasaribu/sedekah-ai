"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-5xl">📊</p>
        <h1 className="mt-4 text-xl font-bold text-ink-black">
          Dashboard tidak dapat dimuat
        </h1>
        <p className="mt-2 text-sm text-ink-mid">
          Data perjalanan sedekah Anda aman. Terjadi gangguan sementara saat
          memuat dashboard. Silakan coba lagi.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Muat Ulang</Button>
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
