// ============================================================
// API Route — Poll Donation Payment Status
// ============================================================
// Digunakan oleh ChatInterface untuk mendeteksi kapan user
// selesai membayar di Mayar (webhook → DB → polling → UI update)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const invoiceId = req.nextUrl.searchParams.get("invoiceId");

  if (!invoiceId) {
    return NextResponse.json(
      { error: "Parameter invoiceId diperlukan" },
      { status: 400 },
    );
  }

  // Auth guard: pastikan user ter-autentikasi
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const donation = await prisma.donation.findFirst({
    where: { mayarInvoiceId: invoiceId },
    select: {
      status: true,
      paidAt: true,
      amount: true,
      type: true,
      donorIntent: true,
      islamicContext: true,
      userId: true,
      user: { select: { authId: true } },
    },
  });

  if (!donation) {
    return NextResponse.json(
      { error: "Donasi tidak ditemukan" },
      { status: 404 },
    );
  }

  // Verify ownership: hanya pemilik donasi yang boleh cek status
  if (donation.user?.authId !== user.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    status: donation.status,
    paidAt: donation.paidAt?.toISOString() ?? null,
    amount: donation.amount,
    type: donation.type,
    donorIntent: donation.donorIntent,
    islamicContext: donation.islamicContext,
  });
}
