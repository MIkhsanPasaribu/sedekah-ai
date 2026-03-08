import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// Zakat Constants (2026)
// ============================================================

/** Harga emas referensi 2026 per gram */
export const HARGA_EMAS_PER_GRAM = 1_000_000;

/** Nisab emas dalam gram */
export const NISAB_EMAS_GRAM = 85;

/** Nisab dalam Rupiah (85g × Rp 1.000.000) */
export const NISAB_RUPIAH = NISAB_EMAS_GRAM * HARGA_EMAS_PER_GRAM;

/** Tarif zakat mal standar */
export const TARIF_ZAKAT = 0.025;

/** Zakat fitrah per jiwa (≈ 3.5 liter beras) */
export const ZAKAT_FITRAH_PER_JIWA = 45_000;

// ============================================================
// Formatting Helpers
// ============================================================

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function hitungPersentase(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((current / target) * 100);
}

// ============================================================
// Category Helpers
// ============================================================

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    pendidikan: "📚",
    kesehatan: "🏥",
    pangan: "🍚",
    bencana: "🆘",
    yatim: "👶",
    masjid: "🕌",
    air_bersih: "💧",
    ekonomi: "💰",
    dakwah: "📖",
    zakat_fitrah: "🌙",
    zakat_mal: "💎",
    infaq: "💚",
    sedekah: "🤲",
  };
  return map[category.toLowerCase()] ?? "💚";
}

// ============================================================
// Trust Score Helpers
// ============================================================

export function getTrustScoreColor(score: number): string {
  if (score >= 85) return "#16A34A";
  if (score >= 70) return "#4ADE80";
  if (score >= 55) return "#EAB308";
  if (score >= 40) return "#F97316";
  return "#DC2626";
}

export function getTrustScoreBg(score: number): string {
  if (score >= 85) return "#DCFCE7";
  if (score >= 70) return "#DCFCE7";
  if (score >= 55) return "#FEF9C3";
  if (score >= 40) return "#FFEDD5";
  return "#FEE2E2";
}

export function getTrustScoreLabel(score: number): string {
  if (score >= 85) return "Sangat Terpercaya";
  if (score >= 70) return "Terpercaya";
  if (score >= 55) return "Cukup Baik";
  if (score >= 40) return "Perlu Perhatian";
  return "Berisiko Tinggi";
}
