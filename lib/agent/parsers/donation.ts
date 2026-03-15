export function parseDonationAmount(text: string): number | null {
  const normalized = text
    .toLowerCase()
    .replace(/rp\.?\s*/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .trim();

  // Try matching number followed by an optional unit
  const match = normalized.match(
    /(\d+(?:\.\d+)?)\s*(miliar|milyar|m|juta|jt|ribu|rb|k)?/i,
  );
  if (!match) return null;

  const base = Number(match[1]);
  if (!Number.isFinite(base) || base <= 0) return null;

  const unit = (match[2] ?? "").toLowerCase();
  if (unit === "miliar" || unit === "milyar" || unit === "m")
    return Math.round(base * 1_000_000_000);
  if (unit === "juta" || unit === "jt") return Math.round(base * 1_000_000);
  if (unit === "ribu" || unit === "rb" || unit === "k")
    return Math.round(base * 1_000);

  return Math.round(base);
}

export function hasExplicitAmountSignal(text: string): boolean {
  const normalized = text.toLowerCase();
  if (
    /((\brp\b|\bidr\b|nominal|donasi|sedekah|infaq|infak|wakaf|bayar|zakat|budget|mau\s+keluarkan|sisihkan|anggarkan|alokasikan))/i.test(
      normalized,
    )
  ) {
    return true;
  }

  return /^\s*(rp\.?\s*)?\d+(?:[.,]\d+)?\s*(miliar|milyar|m|juta|jt|ribu|rb|k)?\s*$/i.test(
    normalized,
  );
}
