"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CampaignsError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Campaigns error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-5xl">🕌</p>
        <h1 className="mt-4 text-xl font-bold text-ink-black">
          Kampanye tidak dapat dimuat
        </h1>
        <p className="mt-2 text-sm text-ink-mid">
          Terjadi gangguan sementara. Semua kampanye masih aktif dan siap
          menerima donasi Anda.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Coba Lagi</Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/campaigns")}
          >
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}
