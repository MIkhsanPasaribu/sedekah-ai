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
          ) : (
            <div className="prose-sm whitespace-pre-wrap text-sm leading-relaxed text-ink-dark">
              {renderContent(content)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Simple markdown-like rendering for bold text and links
 */
function renderContent(content: string): React.ReactNode {
  // Split by **bold** patterns
  const parts = content.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);

  return parts.map((part, i) => {
    // Bold text
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Links [text](url)
    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand-gold-core underline hover:text-brand-gold-deep"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <span key={i}>{part}</span>;
  });
}
