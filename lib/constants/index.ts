// ============================================================
// Global Constants — SEDEKAH.AI
// ============================================================

// Trust Score thresholds used by agent nodes
export const TRUST_SCORE_THRESHOLD_RESEARCH = 40;
export const TRUST_SCORE_THRESHOLD_RECOMMEND = 55;

// Ramadhan 2026 date range
export const RAMADHAN_2026_START = new Date("2026-02-17");
export const RAMADHAN_2026_END = new Date("2026-03-18");
export const RAMADHAN_DAYS_TOTAL = 29;

// Polling
export const PAYMENT_POLL_INTERVAL_MS = 5_000;
export const PAYMENT_POLL_TIMEOUT_MS = 10 * 60 * 1_000;

// Zakat 2026 reference values
export const NISAB_GRAM_EMAS = 85;
export const HARGA_EMAS_PER_GRAM_2026 = 1_000_000;
export const NISAB_RUPIAH = NISAB_GRAM_EMAS * HARGA_EMAS_PER_GRAM_2026; // 85_000_000
export const TARIF_ZAKAT = 0.025;
export const ZAKAT_FITRAH_PER_JIWA = 45_000;
