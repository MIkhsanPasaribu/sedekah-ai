// ============================================================
// API Route — Alerts: Fraud Alerts for User's Donations
// ============================================================
// GET — Returns fraud flags for campaigns in user's donation history

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export interface DonationAlertItem {
  campaignId: string;
  campaignName: string;
  donationId: string;
  amount: number;
  flagType: string;
  severity: string;
  description: string;
  detectedAt: string;
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json({ alerts: [] });
  }

  // Get user's paid/pending donations that belong to campaigns with fraud flags
  const donations = await prisma.donation.findMany({
    where: {
      userId: dbUser.id,
      status: { in: ["paid", "pending"] },
      campaign: {
        fraudAlerts: { some: {} },
      },
    },
    select: {
      id: true,
      amount: true,
      campaignId: true,
      campaign: {
        select: {
          id: true,
          name: true,
          fraudAlerts: {
            select: {
              flagType: true,
              severity: true,
              description: true,
              detectedAt: true,
            },
            where: { severity: { in: ["high", "critical"] } },
            orderBy: { detectedAt: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  const alerts: DonationAlertItem[] = [];
  for (const d of donations) {
    const flag = d.campaign?.fraudAlerts[0];
    if (!flag || !d.campaign) continue;
    alerts.push({
      campaignId: d.campaign.id,
      campaignName: d.campaign.name,
      donationId: d.id,
      amount: d.amount,
      flagType: flag.flagType,
      severity: flag.severity,
      description: flag.description,
      detectedAt: flag.detectedAt.toISOString(),
    });
  }

  return NextResponse.json({ alerts });
}
