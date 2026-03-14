// ============================================================
// API Route — Autopilot: Top-up Customer Credit
// ============================================================
// POST — Add kredit ke Mayar customer untuk fitur autopilot direct debit

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { addCustomerCredit } from "@/lib/mayar/credits";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, mayarCustomerId: true },
  });

  if (!dbUser) {
    return NextResponse.json(
      { error: "Profil tidak ditemukan" },
      { status: 404 },
    );
  }

  if (!dbUser.mayarCustomerId) {
    return NextResponse.json(
      {
        error:
          "Akun Mayar belum terdaftar. Lakukan donasi pertama terlebih dahulu.",
      },
      { status: 400 },
    );
  }

  const body = await req.json();
  const { amount, productId, description } = body;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "Jumlah kredit harus lebih dari 0" },
      { status: 400 },
    );
  }

  if (!productId || typeof productId !== "string") {
    return NextResponse.json(
      { error: "productId diperlukan" },
      { status: 400 },
    );
  }

  const result = await addCustomerCredit({
    customerId: dbUser.mayarCustomerId,
    productId,
    amount,
  });

  return NextResponse.json({ success: true, result });
}
