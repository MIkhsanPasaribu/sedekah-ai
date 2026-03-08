import { NextRequest, NextResponse } from "next/server";

/**
 * Cron-triggered endpoint — scheduled by Vercel at 07:00 WIB (00:00 UTC) daily.
 * Protected by CRON_SECRET header.
 */
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Dynamically import prisma + mayar to avoid cold-start overhead in cron
    const { prisma } = await import("@/lib/prisma");
    const { createInvoice } = await import("@/lib/mayar/invoice");

    const now = new Date();

    // Find all active configs where nextRunAt <= now
    const configs = await prisma.autopilotConfig.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now },
      },
      include: {
        user: {
          select: { id: true, email: true, name: true, mayarCustomerId: true },
        },
      },
    });

    let processed = 0;
    let failed = 0;

    for (const config of configs) {
      try {
        // Pick top campaign matching user's categories
        const campaign = await prisma.campaign.findFirst({
          where: {
            isActive: true,
            category: {
              in: config.categories as (
                | "yatim"
                | "bencana"
                | "kesehatan"
                | "pendidikan"
                | "pangan"
              )[],
            },
          },
          orderBy: { trustScore: "desc" },
        });

        const monthLabel = new Date().toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });

        const invoiceRes = await createInvoice({
          name: config.user.name ?? config.user.email,
          email: config.user.email,
          amount: config.monthlyAmount,
          description: `Donasi otomatis bulanan — ${monthLabel}`,
        });

        // Record donation
        await prisma.donation.create({
          data: {
            userId: config.user.id,
            amount: config.monthlyAmount,
            type: "sedekah",
            donorIntent: "Donasi otomatis bulanan via Autopilot",
            campaignId: campaign?.id ?? null,
            mayarInvoiceId: invoiceRes.data?.id ?? null,
            mayarPaymentLink: invoiceRes.data?.link ?? null,
            status: "pending",
          },
        });

        // Advance nextRunAt by 1 month
        const nextRun = new Date(config.nextRunAt!);
        nextRun.setMonth(nextRun.getMonth() + 1);

        await prisma.autopilotConfig.update({
          where: { id: config.id },
          data: { lastRunAt: now, nextRunAt: nextRun },
        });

        processed++;
      } catch (err) {
        console.error(`[Autopilot] Failed for userId=${config.userId}:`, err);
        failed++;
      }
    }

    return NextResponse.json({ success: true, processed, failed });
  } catch (error) {
    console.error("[Autopilot Execute]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
