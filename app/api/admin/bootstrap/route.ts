// ============================================================
// API Route — Admin: Bootstrap Webhook Registration
// ============================================================
// POST — Register this app's webhook URL to Mayar

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { registerWebhook } from "@/lib/mayar/webhook";
import { getRequiredAppBaseUrl } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  let appUrl: string;
  try {
    appUrl = getRequiredAppBaseUrl();
  } catch {
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
