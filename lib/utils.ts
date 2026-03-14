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

/** Campaign categories — emoji map (used by CampaignCard, CampaignForm, etc.) */
export const CAMPAIGN_CATEGORY_EMOJI: Record<string, string> = {
  yatim: "👦",
  bencana: "🆘",
  kesehatan: "🏥",
  pendidikan: "📚",
  pangan: "🍚",
};

/** Campaign categories — Indonesian label map */
export const CAMPAIGN_CATEGORY_LABEL: Record<string, string> = {
  yatim: "Yatim",
  bencana: "Bencana",
  kesehatan: "Kesehatan",
  pendidikan: "Pendidikan",
  pangan: "Pangan",
};

export function getCampaignCategoryEmoji(category: string): string {
  return CAMPAIGN_CATEGORY_EMOJI[category.toLowerCase()] ?? "💚";
}

export function getCampaignCategoryLabel(category: string): string {
  return CAMPAIGN_CATEGORY_LABEL[category.toLowerCase()] ?? category;
}

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

// ============================================================
// Ramadhan Helpers
// ============================================================

// Per-category cost-per-beneficiary rates (in Rupiah)
const BENEFICIARY_RATES: Record<string, number> = {
  yatim: 200_000,
  bencana: 100_000,
  kesehatan: 150_000,
  pangan: 10_000,
  pendidikan: 250_000,
};
const DEFAULT_BENEFICIARY_RATE = 50_000;

/**
 * Estimate the number of beneficiaries for a donation based on its category.
 * Uses per-category cost-per-beneficiary rates; falls back to Rp50k default.
 */
export function estimateBeneficiaries(
  amount: number,
  category: string,
): number {
  const rate =
    BENEFICIARY_RATES[category.toLowerCase()] ?? DEFAULT_BENEFICIARY_RATE;
  return Math.max(0, Math.floor(amount / rate));
}

/**
 * Generates a contextual daily nudge message based on the current Ramadhan day.
 * Returns null if outside of Ramadhan (ramadhanDay <= 0).
 */
export function getDailyNudge(
  ramadhanDay: number,
  donatedToday: boolean,
): string | null {
  if (ramadhanDay <= 0) return null;

  if (donatedToday) {
    return `Alhamdulillah! Hari ke-${ramadhanDay} Ramadhan sudah tercatat. Semoga Allah melipatgandakan kebaikan Anda — QS 2:261. 🤲`;
  }

  if (ramadhanDay <= 10) {
    // 10 hari pertama: Rahmat
    const messages = [
      `Hari ke-${ramadhanDay} Ramadhan — 10 malam penuh rahmat. Mulailah perjalanan sedekah Anda hari ini, walau dengan nominal kecil. 💚`,
      `Di hari ke-${ramadhanDay} ini, Allah membuka pintu rahmat selebar-lebarnya. Setiap rupiah sedekah Anda adalah investasi akhirat. 🌙`,
      `Hari ke-${ramadhanDay}: "Barang siapa yang memberi makan orang yang berpuasa, maka ia mendapat pahala seperti orang puasa itu." — HR. Tirmidzi`,
    ];
    return messages[ramadhanDay % messages.length];
  } else if (ramadhanDay <= 20) {
    // 10 hari kedua: Maghfirah
    const messages = [
      `Hari ke-${ramadhanDay} Ramadhan — 10 malam penuh maghfirah. Jangan biarkan hari ini berlalu tanpa amal jariyah. 🕌`,
      `Hari ke-${ramadhanDay}: Dosa-dosa diampuni di bulan ini. Perkuat dengan sedekah yang membersihkan harta Anda. 🤲`,
      `Di hari ke-${ramadhanDay} ini, setiap kebaikan dilipatgandakan. Kampanye yang membutuhkan bantuan Anda masih terbuka. 💡`,
    ];
    return messages[ramadhanDay % messages.length];
  } else {
    // 10 hari terakhir: Itqun min an-nar (Pembebasan dari api neraka)
    const messages = [
      `Hari ke-${ramadhanDay} Ramadhan — 10 malam terakhir, malam-malam paling mulia. Manfaatkan setiap saat untuk beramal. ✨`,
      `Hari ke-${ramadhanDay}: Lailatul Qadar tersembunyi di malam-malam ini. Perbanyak sedekah untuk meraih malam seribu bulan. 🌟`,
      `Di hari ke-${ramadhanDay} ini, jangan biarkan Ramadhan berlalu tanpa meninggalkan jejak kebaikan yang abadi. 💎`,
    ];
    return messages[ramadhanDay % messages.length];
  }
}
