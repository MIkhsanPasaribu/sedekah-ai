// ============================================================
// API Route — Admin: Campaign Balance Summary
// ============================================================
// GET — Returns all campaigns with collectedAmount, totalDisbursed,
//        and undisbursedBalance for the disbursements UI

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const campaigns = await prisma.campaign.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      laz: true,
      category: true,
      collectedAmount: true,
      _count: { select: { disbursements: true } },
    },
    orderBy: { name: "asc" },
  });

  // For each campaign, aggregate total disbursed (non-pending)
  const disbursedAggregates = await prisma.disbursement.groupBy({
    by: ["campaignId"],
    where: { status: { notIn: ["pending"] } },
    _sum: { amount: true },
  });

  const disbursedMap = new Map(
    disbursedAggregates.map((d) => [d.campaignId, d._sum.amount ?? 0]),
  );

  const balances = campaigns.map((c) => {
    const totalDisbursed = disbursedMap.get(c.id) ?? 0;
    return {
      id: c.id,
      name: c.name,
      laz: c.laz,
      category: c.category,
      collectedAmount: c.collectedAmount,
      totalDisbursed,
      undisbursedBalance: c.collectedAmount - totalDisbursed,
    };
  });

  return NextResponse.json({ success: true, balances });
}
