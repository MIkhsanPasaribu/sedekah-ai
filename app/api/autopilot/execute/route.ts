import { NextRequest, NextResponse } from "next/server";

/**
 * Cron-triggered endpoint — scheduled by Vercel at 07:00 WIB (00:00 UTC) daily.
 * Protected by CRON_SECRET header.
 *
 * Flow:
 * 1. Find active autopilot configs due for execution
 * 2. Select top-3 trusted campaigns matching user categories
 * 3. Try Mayar Credit System (spendCustomerCredit) for zero-friction deduction
 * 4. Fallback to Mayar Invoice if no credit balance
 * 5. Create donation records and advance nextRunAt
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
    const { getCustomerCreditBalance, spendCustomerCredit } = await import(
      "@/lib/mayar/credits"
    );

    const now = new Date();
    const AUTOPILOT_PRODUCT_ID = process.env.MAYAR_AUTOPILOT_PRODUCT_ID ?? "";

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
    let creditUsed = 0;
    let invoiceUsed = 0;

    for (const config of configs) {
      try {
        // Pick top 3 trusted campaigns matching user's categories
        const topCampaigns = await prisma.campaign.findMany({
          where: {
            isActive: true,
            trustScore: { gte: 55 },
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
          take: 3,
        });

        // Fallback: any active campaign if no category match
        const usableCampaigns =
          topCampaigns.length > 0
            ? topCampaigns
            : await prisma.campaign.findMany({
                where: { isActive: true, trustScore: { gte: 55 } },
                orderBy: { trustScore: "desc" },
                take: 3,
              });

        // Weighted allocation by trust score
        const totalScore = usableCampaigns.reduce(
          (sum, c) => sum + c.trustScore,
          0,
        );
        const allocations = usableCampaigns.map((c) => ({
          campaign: c,
          amount: Math.round(
            (config.monthlyAmount * c.trustScore) / Math.max(totalScore, 1),
          ),
        }));

        // Correct rounding so sum exactly equals monthlyAmount
        const allocatedTotal = allocations.reduce(
          (sum, a) => sum + a.amount,
          0,
        );
        if (allocations.length > 0 && allocatedTotal !== config.monthlyAmount) {
          allocations[0].amount += config.monthlyAmount - allocatedTotal;
        }

        const monthLabel = new Date().toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        });

        // --- Mayar Credit System: Try spend credit first ---
        let paymentMethod: "credit" | "invoice" = "invoice";
        let invoiceId: string | null = null;
        let paymentLink: string | null = null;

        if (config.user.mayarCustomerId && AUTOPILOT_PRODUCT_ID) {
          try {
            const balanceRes = await getCustomerCreditBalance(
              config.user.mayarCustomerId,
            );
            const balance = balanceRes.data?.balance ?? 0;

            if (balance >= config.monthlyAmount) {
              // Sufficient credit — spend directly (zero-friction)
              await spendCustomerCredit({
                customerId: config.user.mayarCustomerId,
                productId: AUTOPILOT_PRODUCT_ID,
                amount: config.monthlyAmount,
              });
              paymentMethod = "credit";
              creditUsed++;
              console.log(
                `[Autopilot] Credit spent for userId=${config.userId}: ${config.monthlyAmount}`,
              );
            }
          } catch (creditErr) {
            // Credit system unavailable — fallback to invoice
            console.warn(
              `[Autopilot] Credit check failed, falling back to invoice for userId=${config.userId}:`,
              creditErr,
            );
          }
        }

        // --- Fallback: Create Mayar Invoice if credit not used ---
        if (paymentMethod === "invoice") {
          const invoiceRes = await createInvoice({
            name: config.user.name ?? config.user.email,
            email: config.user.email,
            amount: config.monthlyAmount,
            description: `Donasi otomatis bulanan — ${monthLabel}`,
          });
          invoiceId = invoiceRes.data?.id ?? null;
          paymentLink = invoiceRes.data?.link ?? null;
          invoiceUsed++;
        }

        // Create one Donation record per campaign allocation (shared invoice)
        for (const alloc of allocations) {
          await prisma.donation.create({
            data: {
              userId: config.user.id,
              amount: alloc.amount,
              type: "sedekah",
              donorIntent: `Donasi otomatis bulanan via Autopilot — ${alloc.campaign.name}`,
              campaignId: alloc.campaign.id,
              mayarInvoiceId: invoiceId,
              mayarPaymentLink: paymentLink,
              // Credit-based = instant paid, Invoice = pending until webhook
              status: paymentMethod === "credit" ? "paid" : "pending",
              paidAt: paymentMethod === "credit" ? now : null,
            },
          });
        }

        // If paid via credit, update campaign collected amounts
        if (paymentMethod === "credit") {
          for (const alloc of allocations) {
            await prisma.campaign.update({
              where: { id: alloc.campaign.id },
              data: { collectedAmount: { increment: alloc.amount } },
            });
          }
        }

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

    return NextResponse.json({
      success: true,
      processed,
      failed,
      creditUsed,
      invoiceUsed,
    });
  } catch (error) {
    console.error("[Autopilot Execute]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
