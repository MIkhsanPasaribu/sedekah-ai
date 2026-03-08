// ============================================================
// API Route — Poll Donation Payment Status
// ============================================================
// Digunakan oleh ChatInterface untuk mendeteksi kapan user
// selesai membayar di Mayar (webhook → DB → polling → UI update)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { getInvoice } from "@/lib/mayar/invoice";

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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const donation = await prisma.donation.findFirst({
    where: { mayarInvoiceId: invoiceId },
    select: {
      id: true,
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Jika status masih pending, cek langsung ke Mayar API sebagai fallback
  // (kalau webhook gagal terkirim, status di DB tetap bisa diperbarui)
  let currentStatus = donation.status;
  let paidAt = donation.paidAt;

  if (currentStatus === "pending") {
    try {
      const mayarInvoice = await getInvoice(invoiceId);
      const mayarStatus = mayarInvoice.data?.status;

      if (mayarStatus && mayarStatus !== "unpaid") {
        // Map Mayar status to our DonationStatus enum
        const mappedStatus =
          mayarStatus === "paid"
            ? ("paid" as const)
            : mayarStatus === "expired"
              ? ("expired" as const)
              : mayarStatus === "cancelled"
                ? ("failed" as const)
                : null;

        if (mappedStatus) {
          const updateData: { status: typeof mappedStatus; paidAt?: Date } = {
            status: mappedStatus,
          };
          if (mappedStatus === "paid") {
            updateData.paidAt = mayarInvoice.data?.transaction?.paidAt
              ? new Date(mayarInvoice.data.transaction.paidAt)
              : new Date();
          }

          // Update semua donations untuk invoice ini + increment campaign collectedAmount
          const allDonations = await prisma.donation.findMany({
            where: { mayarInvoiceId: invoiceId, status: { not: "paid" } },
            select: { id: true, amount: true, campaignId: true },
          });

          await prisma.$transaction(async (tx) => {
            await tx.donation.updateMany({
              where: { mayarInvoiceId: invoiceId, status: { not: "paid" } },
              data: updateData,
            });

            if (mappedStatus === "paid") {
              const campaignIncrements = new Map<string, number>();
              for (const d of allDonations) {
                if (d.campaignId) {
                  campaignIncrements.set(
                    d.campaignId,
                    (campaignIncrements.get(d.campaignId) ?? 0) + d.amount,
                  );
                }
              }
              for (const [cId, inc] of campaignIncrements) {
                await tx.campaign.update({
                  where: { id: cId },
                  data: { collectedAmount: { increment: inc } },
                });
              }
            }
          });

          currentStatus = mappedStatus;
          paidAt = updateData.paidAt ?? paidAt;
        }
      }
    } catch (error) {
      // Non-fatal: jika Mayar API gagal, tetap return status dari DB
      console.error("[Donation Status] Mayar API fallback failed:", error);
    }
  }

  return NextResponse.json({
    status: currentStatus,
    paidAt: paidAt?.toISOString() ?? null,
    amount: donation.amount,
    type: donation.type,
    donorIntent: donation.donorIntent,
    islamicContext: donation.islamicContext,
  });
}
