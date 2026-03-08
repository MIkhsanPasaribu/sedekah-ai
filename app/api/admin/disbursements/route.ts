// ============================================================
// API Route — Admin: Disbursement Management
// ============================================================
// GET  — List disbursements (filterable by status)
// POST — Create new disbursement for a campaign

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const status = req.nextUrl.searchParams.get("status");
  const campaignId = req.nextUrl.searchParams.get("campaignId");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (campaignId) where.campaignId = campaignId;

  const disbursements = await prisma.disbursement.findMany({
    where,
    include: {
      campaign: { select: { name: true, laz: true, category: true } },
      disbursedBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, disbursements });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { user, error } = await requireAdmin();
  if (error || !user) {
    return NextResponse.json(
      { error: error?.message ?? "Unauthorized" },
      { status: error?.status ?? 401 },
    );
  }

  const body = await req.json();
  const { campaignId, amount, recipientAccount, notes } = body;

  // Validasi
  if (!campaignId || typeof campaignId !== "string") {
    return NextResponse.json(
      { error: "Campaign ID diperlukan" },
      { status: 400 },
    );
  }

  if (!amount || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "Jumlah penyaluran harus lebih dari 0" },
      { status: 400 },
    );
  }

  // Cek campaign exists dan hitung saldo yang belum disalurkan
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: { id: true, laz: true, collectedAmount: true },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Kampanye tidak ditemukan" },
      { status: 404 },
    );
  }

  // Hitung total yang sudah/sedang disalurkan (exclude failed jika ada di masa depan)
  const disbursedAggregate = await prisma.disbursement.aggregate({
    where: {
      campaignId,
      status: { notIn: ["pending"] },
    },
    _sum: { amount: true },
  });

  const totalDisbursed = disbursedAggregate._sum.amount ?? 0;
  const undisbursedBalance = campaign.collectedAmount - totalDisbursed;

  if (amount > undisbursedBalance) {
    return NextResponse.json(
      {
        error: `Saldo tersedia hanya ${undisbursedBalance.toLocaleString("id-ID")}. Tidak bisa menyalurkan ${amount.toLocaleString("id-ID")}.`,
      },
      { status: 400 },
    );
  }

  const disbursement = await prisma.disbursement.create({
    data: {
      campaignId,
      amount,
      recipientLaz: campaign.laz,
      recipientAccount: recipientAccount ?? null,
      notes: notes ?? null,
      disbursedById: user.id,
      status: "pending",
    },
    include: {
      campaign: { select: { name: true, laz: true } },
    },
  });

  return NextResponse.json({ success: true, disbursement }, { status: 201 });
}
