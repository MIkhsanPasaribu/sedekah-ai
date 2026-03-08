"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface CampaignFilterProps {
  activeCategory: string | null;
}

const CATEGORIES = [
  { value: null, label: "Semua", emoji: "🌐" },
  { value: "yatim", label: "Yatim", emoji: "👦" },
  { value: "bencana", label: "Bencana", emoji: "🆘" },
  { value: "kesehatan", label: "Kesehatan", emoji: "🏥" },
  { value: "pendidikan", label: "Pendidikan", emoji: "📚" },
  { value: "pangan", label: "Pangan", emoji: "🍚" },
];

export function CampaignFilter({ activeCategory }: CampaignFilterProps) {
  const router = useRouter();

  function handleCategoryChange(category: string | null): void {
    if (category) {
      router.push(`/campaigns?kategori=${category}`);
    } else {
      router.push("/campaigns");
    }
  }

  return (
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
  );
}
