// ============================================================
// Mayar API — Webhook Module
// ============================================================

import { mayarFetch } from "./client";
import type {
  RegisterWebhookRequest,
  MayarApiResponse,
  MayarWebhook,
} from "./types";

/**
 * Register webhook URL untuk menerima notifikasi pembayaran.
 * POST /webhook/register
 */
export async function registerWebhook(
  request: RegisterWebhookRequest,
): Promise<MayarApiResponse<MayarWebhook>> {
  return mayarFetch<MayarApiResponse<MayarWebhook>>({
    method: "POST",
    path: "/webhook/register",
    body: request as unknown as Record<string, unknown>,
  });
}
