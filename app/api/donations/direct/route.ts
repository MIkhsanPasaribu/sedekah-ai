// ============================================================
// POST /api/donations/direct — Quick Donation (no AI chat)
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/mayar/invoice";
import { pickInvoiceData } from "@/lib/mayar/invoice";
import { directDonationSchema } from "@/lib/validations/donation";
import { getRequiredAppBaseUrl } from "@/lib/env";
import { inferUserName } from "@/lib/auth/infer-user-name";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 },
      );
    }

    // Parse + validate body
    const body = await req.json();
    const parsed = directDonationSchema.safeParse(body);
    if (!parsed.success) {
      const message =
        parsed.error.issues[0]?.message ?? "Data donasi tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { campaignId, amount, name, email, message } = parsed.data;

    // Verify campaign exists and is active
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId, isActive: true },
      select: { id: true, name: true },
    });

    if (!campaign) {
      return NextResponse.json(
        { error: "Kampanye tidak ditemukan atau sudah tidak aktif" },
        { status: 404 },
      );
    }

    // Get DB user (for userId FK), create if missing
    let dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { id: true, mobile: true },
    });

    if (!dbUser) {
      const inferredName = inferUserName(user);

      dbUser = await prisma.user.create({
        data: {
          authId: user.id,
          email: user.email ?? email,
          name: inferredName,
        },
        select: { id: true, mobile: true },
      });
    }

    const appUrl = getRequiredAppBaseUrl();
    const mobile = dbUser.mobile?.trim() || "081234567890";
    const customerRef = `DIRECT-${dbUser.id.slice(0, 8)}-${Date.now()}`;

    // Create Mayar invoice (ensures webhook + status polling work correctly)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const invoiceResult = await createInvoice({
      name,
      email,
      mobile,
      amount,
      description:
        message ??
        `Donasi untuk ${campaign.name} via SEDEKAH.AI — Semoga Allah melipatgandakan kebaikan Anda`,
      redirectUrl: `${appUrl}/success?campaign=${encodeURIComponent(campaign.name)}&amount=${amount}`,
      expiredAt: expiresAt,
      items: [
        {
          quantity: 1,
          rate: amount,
          description:
            message ??
            `Donasi untuk ${campaign.name} via SEDEKAH.AI — Semoga Allah melipatgandakan kebaikan Anda`,
        },
      ],
      extraData: {
        noCustomer: customerRef,
        idProd: campaignId,
      },
    });

    const invoice = pickInvoiceData(invoiceResult.data);

    if (invoiceResult.statusCode !== 200 || !invoice) {
      return NextResponse.json(
        { error: "Gagal membuat link pembayaran. Coba lagi." },
        { status: 502 },
      );
    }

    const paymentLink = invoice.link || invoice.paymentUrl;
    const mayarId = invoice.id;

    if (!paymentLink || !mayarId) {
      return NextResponse.json(
        { error: "Link pembayaran tidak valid dari gateway." },
        { status: 502 },
      );
    }

    // Save pending Donation record
    const donation = await prisma.donation.create({
      data: {
        userId: dbUser.id,
        campaignId,
        amount,
        type: "sedekah",
        status: "pending",
        mayarInvoiceId: mayarId,
        mayarPaymentLink: paymentLink,
        islamicContext:
          "وَمَا تُنفِقُوا مِن خَيْرٍ فَإِنَّ اللَّهَ بِهِ عَلِيمٌ — QS 2:273",
      },
    });

    return NextResponse.json({
      paymentLink,
      donationId: donation.id,
    });
  } catch (error) {
    console.error("[direct-donation]", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan. Silakan coba lagi." },
      { status: 500 },
    );
  }
}
