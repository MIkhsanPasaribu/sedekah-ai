"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { OnboardingTour } from "@/components/shared/OnboardingTour";

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
    <>
      <OnboardingTour />
      <ChatInterface
        initialThreadId={initialThreadId}
        onThreadChange={handleThreadChange}
      />
    </>
  );
}
