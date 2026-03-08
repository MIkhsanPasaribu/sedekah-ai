// ============================================================
// GET /api/campaigns/[id]/recent — Recent paid donations (anonymized)
// Used by DonationTicker component (polls every 30s)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function anonymizeName(name: string | null): string {
  if (!name || name.trim() === "") return "Dermawan";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const initials = parts
    .slice(1)
    .map((w) => w[0]?.toUpperCase() + ".")
    .join(" ");
  return `${parts[0]} ${initials}`;
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  const { id } = await params;

  const donations = await prisma.donation.findMany({
    where: {
      campaignId: id,
      status: "paid",
    },
    select: {
      amount: true,
      createdAt: true,
      user: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const result = donations.map((d) => ({
    name: anonymizeName(d.user?.name ?? null),
    amount: d.amount,
    createdAt: d.createdAt.toISOString(),
  }));

  return NextResponse.json(
    { donations: result, total: result.length },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
