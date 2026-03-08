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
        "flex gap-2 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full sm:h-10 sm:w-10",
          isUser ? "bg-brand-green-deep" : "bg-brand-gold-pale",
        )}
      >
        {isUser ? (
          <span className="text-xs font-bold text-white">U</span>
        ) : (
          <Image
            src="/images/logo.png"
            alt="SEDEKAH.AI"
            width={28}
            height={28}
            className="rounded-full sm:h-8 sm:w-8"
          />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 sm:max-w-[80%] sm:px-4 sm:py-3",
          isUser
            ? "rounded-br-md bg-brand-green-deep text-white"
            : "rounded-bl-md bg-surface-white border border-ink-ghost text-ink-dark shadow-sm",
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 animate-bounce rounded-full bg-brand-green-light [animation-delay:-0.3s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-brand-green-light [animation-delay:-0.15s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-brand-green-light" />
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {renderContent(content)}
          </div>
        )}

        {timestamp && (
          <p
            className={cn(
              "mt-1 text-[10px]",
              isUser ? "text-brand-green-pale" : "text-ink-light",
            )}
          >
            {timestamp.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
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
