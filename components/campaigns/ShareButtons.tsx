"use client";

import { useState } from "react";

interface ShareButtonsProps {
  campaignId: string;
  campaignName: string;
  trustScore: number;
}

export function ShareButtons({
  campaignId,
  campaignName,
  trustScore,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? "https://sedekah.ai");

  const campaignUrl = `${appUrl}/campaigns/${campaignId}`;

  const waText = encodeURIComponent(
    `✨ Yuk, bantu sesama via kampanye "${campaignName}" di SEDEKAH.AI!\n\nTingkat kepercayaan: ${trustScore}/100\n\n🔗 ${campaignUrl}`,
  );
  const xText = encodeURIComponent(
    `Ayo berdonasi untuk "${campaignName}" di @SedekahAI — tingkat kepercayaan ${trustScore}/100. ${campaignUrl}`,
  );

  async function handleCopy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select + copy not needed for modern browsers
    }
  }

  function handleNativeShare(): void {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title: campaignName,
        text: `Bantu sesama lewat kampanye ini di SEDEKAH.AI`,
        url: campaignUrl,
      });
    }
  }

  return (
    <div className="mt-6 border-t border-ink-ghost pt-5">
      <p className="mb-3 text-sm font-semibold text-ink-mid">
        Bagikan Kampanye Ini
      </p>
      <div className="flex flex-wrap gap-2">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-brand-green-light bg-brand-green-ghost px-3 py-2 text-xs font-medium text-brand-green-deep transition-colors hover:bg-brand-green-pale"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.55 4.103 1.512 5.828L.06 23.25a.75.75 0 00.916.915l5.44-1.452A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.645-.516-5.148-1.413l-.368-.22-3.822 1.02 1.02-3.83-.22-.37A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          WhatsApp
        </a>

        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${xText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-ink-ghost bg-white px-3 py-2 text-xs font-medium text-ink-dark transition-colors hover:bg-slate-50"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-current"
            aria-hidden="true"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L2.012 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          X/Twitter
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-ink-ghost bg-white px-3 py-2 text-xs font-medium text-ink-dark transition-colors hover:bg-slate-50"
        >
          {copied ? (
            <>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-none stroke-current stroke-2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Disalin!
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-none stroke-current stroke-2"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                />
              </svg>
              Salin Link
            </>
          )}
        </button>

        {/* Native Share (mobile) */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 rounded-lg border border-ink-ghost bg-white px-3 py-2 text-xs font-medium text-ink-dark transition-colors hover:bg-slate-50"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 fill-none stroke-current stroke-2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
            Bagikan
          </button>
        )}
      </div>
    </div>
  );
}
