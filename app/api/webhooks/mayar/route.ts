// ============================================================
// API Route — Mayar Webhook Handler
// ============================================================
// Handles payment.completed event from Mayar

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { MayarWebhookEvent } from "@/lib/mayar/types";

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
    if (receivedToken !== expectedToken) {
      console.warn("[Mayar Webhook] Invalid callback token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as MayarWebhookEvent;

    // Validate webhook event
    if (!body.event || !body.data) {
      return NextResponse.json(
        { error: "Invalid webhook payload" },
        { status: 400 },
      );
    }

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

  // Update donation status di database
  const donation = await prisma.donation.findFirst({
    where: { mayarInvoiceId: id },
  });

  if (!donation) {
    console.warn(`[Mayar Webhook] Donation not found for invoice: ${id}`);
    return;
  }

  await prisma.donation.update({
    where: { id: donation.id },
    data: {
      status: "paid",
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      reflectionSent: false, // Will be sent by Impact Tracker
    },
  });

  // Update user Ramadhan streak (if applicable)
  if (donation.userId) {
    const today = new Date();
    const ramadhanDay = getRamadhanDay(today);

    if (ramadhanDay > 0) {
      // Update streak
      await prisma.user.update({
        where: { id: donation.userId },
        data: {
          ramadhanStreak: { increment: 1 },
        },
      });

      // Create/update giving journey entry
      await prisma.givingJourney.upsert({
        where: {
          userId_ramadhanDay: {
            userId: donation.userId,
            ramadhanDay,
          },
        },
        update: {
          donated: true,
          amount: { increment: amount },
        },
        create: {
          userId: donation.userId,
          ramadhanDay,
          donated: true,
          amount,
        },
      });
    }
  }

  console.log(
    `[Mayar Webhook] Payment completed: ${id}, amount: ${amount}, email: ${customerEmail}`,
  );
}

async function handlePaymentFailed(
  data: MayarWebhookEvent["data"],
): Promise<void> {
  const donation = await prisma.donation.findFirst({
    where: { mayarInvoiceId: data.id },
  });

  if (donation) {
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "failed" },
    });
  }

  console.log(`[Mayar Webhook] Payment failed: ${data.id}`);
}

async function handlePaymentExpired(
  data: MayarWebhookEvent["data"],
): Promise<void> {
  const donation = await prisma.donation.findFirst({
    where: { mayarInvoiceId: data.id },
  });

  if (donation) {
    await prisma.donation.update({
      where: { id: donation.id },
      data: { status: "expired" },
    });
  }

  console.log(`[Mayar Webhook] Payment expired: ${data.id}`);
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
