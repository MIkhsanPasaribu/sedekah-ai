"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Chat error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-warm px-4">
      <div className="w-full max-w-md text-center">
        <p className="text-5xl">🤲</p>
        <h1 className="mt-4 text-xl font-bold text-ink-black">
          AI Agent sedang istirahat
        </h1>
        <p className="mt-2 text-sm text-ink-mid">
          Sepertinya ada yang kurang tepat. Tenang, percakapan Anda tersimpan
          dengan aman. Silakan coba lagi.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset}>Coba Lagi</Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/chat")}
          >
            Chat Baru
          </Button>
        </div>
      </div>
    </div>
  );
}
