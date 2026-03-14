// ============================================================
// API Route — Mayar Webhook Handler
// ============================================================
// Handles payment.completed event from Mayar

import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { incrementCampaignCollected } from "@/lib/db/campaign-helpers";
import type { MayarWebhookEvent } from "@/lib/mayar/types";

// Zod schema for Mayar webhook payload
const webhookPayloadSchema = z.object({
  event: z.string().min(1),
  data: z.object({
    id: z.string().min(1),
    amount: z.number().optional(),
    customerEmail: z.string().email().optional(),
    paidAt: z.string().optional(),
  }),
});

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Validasi X-Callback-Token jika dikonfigurasi —
    // Mayar mengirim header ini saat webhook terdaftar dengan token.
    const expectedToken = process.env.MAYAR_WEBHOOK_SECRET;
    if (!expectedToken) {
      console.error("[Mayar Webhook] MAYAR_WEBHOOK_SECRET not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 },
      );
    }
    const receivedToken = req.headers.get("x-callback-token");
    if (
      !receivedToken ||
      !crypto.timingSafeEqual(
        Buffer.from(receivedToken),
        Buffer.from(expectedToken),
      )
    ) {
      console.warn("[Mayar Webhook] Invalid callback token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate webhook payload with Zod
    const rawBody = await req.json();
    const parsed = webhookPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      console.warn("[Mayar Webhook] Invalid payload:", parsed.error.issues);
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 },
      );
    }
    const body = parsed.data as MayarWebhookEvent;

    console.log(`[Mayar Webhook] Event: ${body.event}, ID: ${body.data.id}`);

    switch (body.event) {
      case "payment.completed":
        await handlePaymentCompleted(body.data);
        break;

      case "payment.failed":
        await handlePaymentFailed(body.data);
        break;

      case "payment.expired":
        await handlePaymentExpired(body.data);
        break;

      default:
        console.log(`[Mayar Webhook] Unhandled event: ${body.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Mayar Webhook Error]:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function handlePaymentCompleted(
  data: MayarWebhookEvent["data"],
): Promise<void> {
  const { id, amount, customerEmail, paidAt } = data;

  // Cari semua donation records untuk invoice ini (bisa multi-allocation)
  const donations = await prisma.donation.findMany({
    where: { mayarInvoiceId: id },
  });

  if (donations.length === 0) {
    console.warn(`[Mayar Webhook] Donation not found for invoice: ${id}`);
    return;
  }

  // Idempotency: skip jika semua sudah paid
  const allPaid = donations.every((d) => d.status === "paid");
  if (allPaid) {
    console.log(`[Mayar Webhook] Already paid, skipping: ${id}`);
    return;
  }

  // Update semua donation records yang belum paid
  const pendingDonations = donations.filter((d) => d.status !== "paid");
  await prisma.donation.updateMany({
    where: {
      mayarInvoiceId: id,
      status: { not: "paid" },
    },
    data: {
      status: "paid",
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      reflectionSent: false,
    },
  });

  // Update collectedAmount setiap kampanye terkait
  await incrementCampaignCollected(pendingDonations, prisma);

  // Update user Ramadhan streak (hanya sekali per invoice)
  const firstDonation = donations[0];
  if (firstDonation.userId) {
    const today = new Date();
    const ramadhanDay = getRamadhanDay(today);

    if (ramadhanDay > 0) {
      await prisma.user.update({
        where: { id: firstDonation.userId },
        data: {
          ramadhanStreak: { increment: 1 },
        },
      });

      // Total amount dari semua alokasi yang baru saja di-update
      const totalAmount = pendingDonations.reduce(
        (sum, d) => sum + d.amount,
        0,
      );

      await prisma.givingJourney.upsert({
        where: {
          userId_ramadhanDay: {
            userId: firstDonation.userId,
            ramadhanDay,
          },
        },
        update: {
          donated: true,
          amount: { increment: totalAmount },
        },
        create: {
          userId: firstDonation.userId,
          ramadhanDay,
          donated: true,
          amount: totalAmount,
        },
      });
    }
  }

  console.log(
    `[Mayar Webhook] Payment completed: ${id}, amount: ${amount}, email: ${customerEmail}, records: ${pendingDonations.length}`,
  );

  // Post-payment notification: add an assistant message to the latest conversation
  if (firstDonation.userId) {
    const latestConversation = await prisma.conversation.findFirst({
      where: { userId: firstDonation.userId },
      orderBy: { updatedAt: "desc" },
    });

    if (latestConversation) {
      const totalAmount = pendingDonations.reduce(
        (sum, d) => sum + d.amount,
        0,
      );
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(totalAmount);

      await prisma.message.create({
        data: {
          conversationId: latestConversation.id,
          role: "assistant",
          content: `✅ **Alhamdulillah! Pembayaran sebesar ${formatted} telah berhasil dikonfirmasi.**\n\nBarakallah fiik — semoga Allah melipatgandakan kebaikan Anda. 🤲\n\nAnda bisa melihat laporan dampak donasi di Dashboard.`,
          metadata: { paymentStatus: "paid", invoiceId: id },
        },
      });
    }
  }
}

async function handlePaymentFailed(
  data: MayarWebhookEvent["data"],
): Promise<void> {
  // Idempotency: hanya update yang belum di terminal state
  const result = await prisma.donation.updateMany({
    where: {
      mayarInvoiceId: data.id,
      status: { notIn: ["paid", "failed"] },
    },
    data: { status: "failed" },
  });

  console.log(
    `[Mayar Webhook] Payment failed: ${data.id}, updated: ${result.count}`,
  );
}

async function handlePaymentExpired(
  data: MayarWebhookEvent["data"],
): Promise<void> {
  // Idempotency: hanya update yang belum di terminal state
  const result = await prisma.donation.updateMany({
    where: {
      mayarInvoiceId: data.id,
      status: { notIn: ["paid", "expired"] },
    },
    data: { status: "expired" },
  });

  console.log(
    `[Mayar Webhook] Payment expired: ${data.id}, updated: ${result.count}`,
  );
}

/**
 * Hitung hari ke-N Ramadhan berdasarkan tanggal.
 * Estimasi Ramadhan 2026: ~17 Feb — 18 Mar 2026
 * Returns 0 jika bukan bulan Ramadhan.
 */
function getRamadhanDay(date: Date): number {
  const ramadhanStart = new Date("2026-02-17");
  const ramadhanEnd = new Date("2026-03-18");

  if (date >= ramadhanStart && date <= ramadhanEnd) {
    const diffMs = date.getTime() - ramadhanStart.getTime();
    return Math.floor(diffMs / 86400000) + 1;
  }
  return 0;
}
