"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { CampaignSearch } from "@/components/campaigns/CampaignSearch";

interface CampaignFilterProps {
  activeCategory: string | null;
  q?: string;
}

const CATEGORIES = [
  { value: null, label: "Semua", emoji: "🌐" },
  { value: "yatim", label: "Yatim", emoji: "👦" },
  { value: "bencana", label: "Bencana", emoji: "🆘" },
  { value: "kesehatan", label: "Kesehatan", emoji: "🏥" },
  { value: "pendidikan", label: "Pendidikan", emoji: "📚" },
  { value: "pangan", label: "Pangan", emoji: "🍚" },
];

export function CampaignFilter({ activeCategory, q }: CampaignFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleCategoryChange(category: string | null): void {
    const params = new URLSearchParams(searchParams.toString());
    if (category) {
      params.set("kategori", category);
    } else {
      params.delete("kategori");
    }
    router.push(`/campaigns?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <CampaignSearch defaultValue={q ?? ""} />
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() => handleCategoryChange(cat.value)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all",
              activeCategory === cat.value
                ? "bg-brand-green-deep text-white shadow-md"
                : "bg-surface-white border border-ink-ghost text-ink-dark hover:border-brand-green-light hover:bg-brand-green-ghost",
            )}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
