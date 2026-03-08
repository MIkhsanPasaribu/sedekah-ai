"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  isLoading?: boolean;
}

export function MessageBubble({
  role,
  content,
  timestamp,
  isLoading,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "group px-4 py-5 sm:px-6",
        isUser ? "bg-transparent" : "bg-surface-white/60",
      )}
    >
      <div className="mx-auto flex max-w-3xl gap-4">
        {/* Avatar */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
            isUser ? "bg-brand-green-deep" : "bg-brand-gold-pale",
          )}
        >
          {isUser ? (
            <span className="text-xs font-bold text-white">U</span>
          ) : (
            <Image
              src="/images/logo.png"
              alt="SEDEKAH.AI"
              width={24}
              height={24}
              className="rounded-full"
            />
          )}
        </div>

        {/* Message Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-dark">
              {isUser ? "Anda" : "Amil AI"}
            </span>
            {timestamp && (
              <span className="text-[10px] text-ink-light">
                {timestamp.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center gap-1.5 py-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-green-light [animation-delay:-0.3s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-green-light [animation-delay:-0.15s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-brand-green-light" />
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed text-ink-dark">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none text-ink-dark [&_a]:font-medium [&_a]:text-brand-gold-core [&_a]:underline [&_a:hover]:text-brand-gold-deep [&_strong]:font-semibold [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 [&_p]:my-1 [&_code]:rounded [&_code]:bg-ink-ghost/30 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-brand-gold-core [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-ink-mid">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
