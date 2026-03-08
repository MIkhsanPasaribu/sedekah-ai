// ============================================================
// Mayar API — Discount Module
// ============================================================

import { mayarFetch } from "./client";
import type {
  CreateDiscountRequest,
  MayarApiResponse,
  MayarDiscount,
} from "./types";

/**
 * Buat kupon diskon promo Ramadhan.
 * POST /discount/create
 */
export async function createDiscount(
  request: CreateDiscountRequest,
): Promise<MayarApiResponse<MayarDiscount>> {
  return mayarFetch<MayarApiResponse<MayarDiscount>>({
    method: "POST",
    path: "/discount/create",
    body: request as unknown as Record<string, unknown>,
  });
}
