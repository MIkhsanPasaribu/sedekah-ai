"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveDiscount {
  active: boolean;
  code?: string;
  label?: string;
  description?: string;
}

export function DiscountBanner() {
  const [discount, setDiscount] = useState<ActiveDiscount | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/discounts/active")
      .then((r) => r.json())
      .then((data: ActiveDiscount) => setDiscount(data))
      .catch(() => null);
  }, []);

  if (!discount?.active || !discount.code) return null;

  function handleCopy() {
    if (!discount?.code) return;
    navigator.clipboard
      .writeText(discount.code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => null);
  }

  return (
    <div className="mx-1 mb-3 flex items-start gap-3 rounded-xl border border-brand-gold-pale bg-brand-gold-ghost px-4 py-3">
      <Tag className="mt-0.5 size-4 shrink-0 text-brand-gold-core" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-brand-gold-deep">
          {discount.label}
        </p>
        <p className="text-xs text-ink-mid">{discount.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="rounded bg-brand-gold-pale px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-brand-gold-deep">
            {discount.code}
          </code>
          <button
            onClick={handleCopy}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium transition-colors",
              copied
                ? "bg-success text-white"
                : "bg-brand-gold-pale text-brand-gold-deep hover:bg-brand-gold-bright/30",
            )}
          >
            {copied ? (
              <>
                <Check className="size-3" />
                Disalin!
              </>
            ) : (
              <>
                <Copy className="size-3" />
                Salin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
