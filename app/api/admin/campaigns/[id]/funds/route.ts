// ============================================================
// API Route — Admin: Campaign Fund Summary
// ============================================================
// GET — Returns collected, disbursed, pending, and available balance

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      laz: true,
      collectedAmount: true,
      targetAmount: true,
    },
  });

  if (!campaign) {
    return NextResponse.json(
      { error: "Kampanye tidak ditemukan" },
      { status: 404 },
    );
  }

  // Aggregate disbursements by status
  const [completedSum, processingSum, pendingSum] = await Promise.all([
    prisma.disbursement.aggregate({
      where: { campaignId: id, status: { in: ["completed", "verified"] } },
      _sum: { amount: true },
    }),
    prisma.disbursement.aggregate({
      where: { campaignId: id, status: "processing" },
      _sum: { amount: true },
    }),
    prisma.disbursement.aggregate({
      where: { campaignId: id, status: "pending" },
      _sum: { amount: true },
    }),
  ]);

  const totalDisbursed = completedSum._sum.amount ?? 0;
  const totalProcessing = processingSum._sum.amount ?? 0;
  const totalPending = pendingSum._sum.amount ?? 0;
  const undisbursedBalance =
    campaign.collectedAmount - totalDisbursed - totalProcessing;

  return NextResponse.json({
    success: true,
    fund: {
      campaignId: campaign.id,
      campaignName: campaign.name,
      laz: campaign.laz,
      targetAmount: campaign.targetAmount,
      collectedAmount: campaign.collectedAmount,
      totalDisbursed,
      totalProcessing,
      totalPending,
      undisbursedBalance,
      collectionPercentage:
        campaign.targetAmount > 0
          ? Math.round((campaign.collectedAmount / campaign.targetAmount) * 100)
          : 0,
      disbursementPercentage:
        campaign.collectedAmount > 0
          ? Math.round((totalDisbursed / campaign.collectedAmount) * 100)
          : 0,
    },
  });
}
