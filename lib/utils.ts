import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Menggabungkan class names dengan clsx + tailwind-merge
 * Mencegah konflik Tailwind utility classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah Indonesia
 * @example formatRupiah(6250000) → "Rp 6.250.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format tanggal ke format Indonesia
 * @example formatTanggal(new Date()) → "5 Maret 2026"
 */
export function formatTanggal(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Hitung persentase pengumpulan dana kampanye
 */
export function hitungPersentase(collected: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(Math.round((collected / target) * 100), 100);
}

/**
 * Dapatkan warna Trust Score berdasarkan nilai skor (hex, untuk inline style)
 */
export function getTrustScoreColor(score: number): string {
  if (score >= 85) return "#16A34A";
  if (score >= 70) return "#4ADE80";
  if (score >= 55) return "#EAB308";
  if (score >= 40) return "#F97316";
  return "#DC2626";
}

/**
 * Dapatkan background Trust Score berdasarkan nilai skor (hex, untuk inline style)
 */
export function getTrustScoreBg(score: number): string {
  if (score >= 85) return "#DCFCE7";
  if (score >= 70) return "#DCFCE7";
  if (score >= 55) return "#FEF9C3";
  if (score >= 40) return "#FEF9C3";
  return "#FEE2E2";
}

/**
 * Dapatkan label Trust Score dalam Bahasa Indonesia
 */
export function getTrustScoreLabel(score: number): string {
  if (score >= 85) return "Sangat Terpercaya";
  if (score >= 70) return "Terpercaya";
  if (score >= 55) return "Cukup Baik";
  if (score >= 40) return "Perlu Perhatian";
  return "Berisiko Tinggi";
}

/**
 * Konstanta zakat
 */
export const NISAB_EMAS_GRAM = 85;
export const HARGA_EMAS_PER_GRAM = 1_000_000; // Rp 1.000.000/gram (2026)
export const NISAB_RUPIAH = NISAB_EMAS_GRAM * HARGA_EMAS_PER_GRAM; // Rp 85.000.000
export const TARIF_ZAKAT = 0.025; // 2.5%
export const ZAKAT_FITRAH_PER_JIWA = 45_000; // Rp 45.000

/**
 * Truncate teks dengan ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Emoji per kategori kampanye
 */
export function getCategoryEmoji(category: string): string {
  const lower = category.toLowerCase();
  if (lower.includes("yatim")) return "👦";
  if (lower.includes("pangan") || lower.includes("sembako")) return "🍚";
  if (lower.includes("kesehatan")) return "🏥";
  if (lower.includes("pendidikan")) return "📚";
  if (lower.includes("bencana")) return "🆘";
  return "💚";
}

/**
 * Generate placeholder avatar dari nama
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
