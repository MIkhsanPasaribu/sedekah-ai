"use client";

import { Share2, MessageCircle, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  /** Title to share */
  title: string;
  /** Text/description to share */
  text: string;
  /** URL to share (defaults to current page) */
  url?: string;
  /** Optional class name */
  className?: string;
  /** Compact mode — icon only */
  compact?: boolean;
}

/**
 * Share button with Web Share API fallback to WhatsApp deep link + copy.
 * Used on campaign pages and impact reports.
 */
export function ShareButton({
  title,
  text,
  url,
  className,
  compact = false,
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrl = url ?? (typeof window !== "undefined" ? window.location.href : "");

  async function handleShare(): Promise<void> {
    // Try native Web Share API first (mobile browsers)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // User cancelled or not supported — show fallback menu
      }
    }
    setShowMenu(!showMenu);
  }

  function handleWhatsApp(): void {
    const waText = encodeURIComponent(`${title}\n\n${text}\n\n${shareUrl}`);
    window.open(`https://wa.me/?text=${waText}`, "_blank", "noopener");
    setShowMenu(false);
  }

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(`${title}\n\n${text}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = `${title}\n\n${text}\n\n${shareUrl}`;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setShowMenu(false);
  }

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        onClick={handleShare}
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-brand-green-light/30 px-3 py-2 text-sm font-medium text-brand-green-deep transition-all hover:bg-brand-green-ghost hover:border-brand-green-light",
          compact && "px-2",
        )}
        title="Bagikan"
      >
        <Share2 className="h-4 w-4" />
        {!compact && <span>Bagikan</span>}
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-ink-ghost bg-surface-white shadow-lg">
          <button
            onClick={handleWhatsApp}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ink-dark transition-colors hover:bg-brand-green-ghost"
          >
            <MessageCircle className="h-4 w-4 text-green-600" />
            WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-3 border-t border-ink-ghost/50 px-4 py-3 text-left text-sm text-ink-dark transition-colors hover:bg-brand-green-ghost"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4 text-ink-mid" />
            )}
            {copied ? "Tersalin!" : "Salin link"}
          </button>
        </div>
      )}

      {/* Backdrop to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}
