// ============================================================
// API Route — Admin: Bootstrap Webhook Registration
// ============================================================
// POST — Register this app's webhook URL to Mayar

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { registerWebhook } from "@/lib/mayar/webhook";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL)
      ? `https://${process.env.VERCEL_URL}`
      : null;

  if (!appUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_APP_URL tidak dikonfigurasi" },
      { status: 500 },
    );
  }

  const webhookToken = process.env.MAYAR_WEBHOOK_SECRET;
  if (!webhookToken) {
    return NextResponse.json(
      { error: "MAYAR_WEBHOOK_SECRET tidak dikonfigurasi" },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const webhookUrl =
    (body.webhookUrl as string) || `${appUrl}/api/webhooks/mayar`;

  const result = await registerWebhook({
    url: webhookUrl,
  });

  return NextResponse.json({
    success: true,
    webhookUrl,
    result,
  });
}
