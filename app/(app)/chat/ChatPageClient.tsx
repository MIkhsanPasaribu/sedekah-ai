"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

interface ChatPageClientProps {
  initialThreadId: string | null;
}

export function ChatPageClient({ initialThreadId }: ChatPageClientProps) {
  const router = useRouter();

  const handleThreadChange = useCallback(
    (threadId: string) => {
      router.replace(`/chat?thread=${encodeURIComponent(threadId)}`, {
        scroll: false,
      });
    },
    [router],
  );

  return (
    <ChatInterface
      initialThreadId={initialThreadId}
      onThreadChange={handleThreadChange}
    />
  );
}
