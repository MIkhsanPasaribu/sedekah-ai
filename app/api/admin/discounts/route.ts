// ============================================================
// API Route — Admin: Discount / Promo Management
// ============================================================
// GET  — List discounts (from Mayar API — basic proxy)
// POST — Create new discount via Mayar

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createDiscount } from "@/lib/mayar/discount";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const body = await req.json();
  const { name, code, amount, type, maxUsage, startDate, endDate } = body;

  // Validasi
  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Nama promo diperlukan" },
      { status: 400 },
    );
  }
  if (!code || typeof code !== "string") {
    return NextResponse.json(
      { error: "Kode promo diperlukan" },
      { status: 400 },
    );
  }
  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "Jumlah diskon harus lebih dari 0" },
      { status: 400 },
    );
  }
  if (type !== "percentage" && type !== "fixed") {
    return NextResponse.json(
      { error: 'Tipe diskon harus "percentage" atau "fixed"' },
      { status: 400 },
    );
  }
  if (type === "percentage" && amount > 100) {
    return NextResponse.json(
      { error: "Persentase diskon tidak boleh lebih dari 100" },
      { status: 400 },
    );
  }

  try {
    const discount = await createDiscount({
      name,
      code: code.toUpperCase(),
      amount,
      type,
      maxUsage: maxUsage ?? undefined,
      startDate: startDate ?? undefined,
      endDate: endDate ?? undefined,
    });

    return NextResponse.json(
      { success: true, discount: discount.data },
      { status: 201 },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal membuat diskon di Mayar";
    return NextResponse.json(
      { error: `Pembuatan promo gagal: ${message}` },
      { status: 500 },
    );
  }
}
