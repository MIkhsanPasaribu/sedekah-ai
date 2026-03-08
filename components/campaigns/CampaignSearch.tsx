"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

interface CampaignSearchProps {
  defaultValue?: string;
}

export function CampaignSearch({ defaultValue = "" }: CampaignSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [, startTransition] = useTransition();

  // Sync if searchParams change externally
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const updateSearch = useCallback(
    (q: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) {
        params.set("q", q.trim());
      } else {
        params.delete("q");
      }
      // Preserve kategori
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      updateSearch(value);
    }, 400);
    return () => clearTimeout(timer);
  }, [value, updateSearch]);

  return (
    <div className="relative max-w-sm w-full">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 stroke-current text-ink-light"
        fill="none"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        type="search"
        placeholder="Cari kampanye..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-full border border-ink-ghost bg-surface-white py-2 pl-9 pr-4 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-light focus:outline-none focus:ring-2 focus:ring-brand-green-ghost"
      />
    </div>
  );
}
