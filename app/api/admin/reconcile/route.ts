// ============================================================
// API Route — Admin: Mayar Transaction Reconciliation
// ============================================================
// POST — Fetch Mayar paid transactions and cross-reference with local DB

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { getPaidTransactions } from "@/lib/mayar/transaction";
import { incrementCampaignCollected } from "@/lib/db/campaign-helpers";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const body = await req.json().catch(() => ({}));
  const page = typeof body.page === "number" ? body.page : 1;
  const pageSize = typeof body.pageSize === "number" ? body.pageSize : 50;

  try {
    // Ambil transaksi dari Mayar
    const mayarResponse = await getPaidTransactions({ page, pageSize });
    const mayarTransactions = mayarResponse.data ?? [];

    // Ambil semua donation yang masih pending di DB
    const pendingDonations = await prisma.donation.findMany({
      where: { status: "pending" },
      select: {
        id: true,
        mayarInvoiceId: true,
        amount: true,
        campaignId: true,
        status: true,
      },
    });

    const pendingInvoiceIds = new Set(
      pendingDonations
        .map((d) => d.mayarInvoiceId)
        .filter((id): id is string => id !== null),
    );

    // Cari transaksi Mayar yang sudah paid tapi di DB masih pending
    const mismatches = mayarTransactions.filter((tx) =>
      pendingInvoiceIds.has(tx.id),
    );

    // Auto-fix: update donations yang harusnya sudah paid
    let fixedCount = 0;
    for (const tx of mismatches) {
      const donations = pendingDonations.filter(
        (d) => d.mayarInvoiceId === tx.id,
      );

      if (donations.length > 0) {
        await prisma.$transaction(async (prismaTx) => {
          // Update semua donation untuk invoice ini
          await prismaTx.donation.updateMany({
            where: { mayarInvoiceId: tx.id, status: "pending" },
            data: { status: "paid" },
          });

          // Increment collectedAmount per campaign
          await incrementCampaignCollected(donations, prismaTx);
        });

        fixedCount += donations.length;
      }
    }

    // Ringkasan
    const totalMayarPaid = mayarTransactions.length;
    const totalLocalPending = pendingDonations.length;
    const mismatchCount = mismatches.length;

    return NextResponse.json({
      success: true,
      reconciliation: {
        mayarPaidTransactions: totalMayarPaid,
        localPendingDonations: totalLocalPending,
        mismatchesFound: mismatchCount,
        donationsFixed: fixedCount,
        page,
        pageSize,
      },
      mismatches: mismatches.map((tx) => ({
        mayarId: tx.id,
        amount: tx.amount,
        paidAt: tx.paidAt,
      })),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal mengambil data dari Mayar";
    return NextResponse.json(
      { error: `Rekonsiliasi gagal: ${message}` },
      { status: 500 },
    );
  }
}
