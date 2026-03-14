// ============================================================
// API Route — Public: Active Discount / Promo
// ============================================================
// GET — Returns current Ramadhan promo code if configured

import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const promoCode = process.env.RAMADHAN_PROMO_CODE;
  const promoLabel = process.env.RAMADHAN_PROMO_LABEL ?? "Promo Ramadhan";
  const promoDesc =
    process.env.RAMADHAN_PROMO_DESC ??
    "Dapatkan keringanan donasi spesial Ramadhan 1447H";

  if (!promoCode) {
    return NextResponse.json({ active: false });
  }

  return NextResponse.json({
    active: true,
    code: promoCode,
    label: promoLabel,
    description: promoDesc,
  });
}
