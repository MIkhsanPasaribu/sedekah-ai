// ============================================================
// DB Helper — Campaign collected amount increments
// ============================================================
// Shared helper to avoid duplicating the campaign-increment
// logic across the webhook, status-poll, and reconcile routes.

import type { PrismaClient } from "@/generated/prisma/client";

type TxClient = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * Increment `collectedAmount` on each campaign for a set of donations.
 * Safe to call inside or outside a Prisma `$transaction` — just pass
 * the transaction client when inside one.
 */
export async function incrementCampaignCollected(
  donations: Array<{ campaignId: string | null; amount: number }>,
  tx: TxClient,
): Promise<void> {
  const campaignIncrements = new Map<string, number>();
  for (const d of donations) {
    if (d.campaignId) {
      campaignIncrements.set(
        d.campaignId,
        (campaignIncrements.get(d.campaignId) ?? 0) + d.amount,
      );
    }
  }
  for (const [campaignId, inc] of campaignIncrements) {
    await tx.campaign.update({
      where: { id: campaignId },
      data: { collectedAmount: { increment: inc } },
    });
  }
}
