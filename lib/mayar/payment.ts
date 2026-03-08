// ============================================================
// Mayar API — Payment Module
// ============================================================

import { mayarFetch } from "./client";
import type {
  CreatePaymentRequest,
  MayarApiResponse,
  MayarPayment,
} from "./types";

/**
 * Buat quick donation payment link.
 * POST /payment/create
 */
export async function createPayment(
  request: CreatePaymentRequest,
): Promise<MayarApiResponse<MayarPayment>> {
  return mayarFetch<MayarApiResponse<MayarPayment>>({
    method: "POST",
    path: "/payment/create",
    body: request as unknown as Record<string, unknown>,
  });
}
