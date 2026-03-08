// ============================================================
// Mayar API — Invoice Module
// ============================================================

import { mayarFetch } from "./client";
import type {
  CreateInvoiceRequest,
  MayarApiResponse,
  MayarInvoice,
} from "./types";

/**
 * Buat invoice baru untuk pembayaran zakat/sedekah.
 * POST /invoice/create
 */
export async function createInvoice(
  request: CreateInvoiceRequest,
): Promise<MayarApiResponse<MayarInvoice>> {
  return mayarFetch<MayarApiResponse<MayarInvoice>>({
    method: "POST",
    path: "/invoice/create",
    body: request as unknown as Record<string, unknown>,
  });
}

/**
 * Ambil detail invoice berdasarkan ID.
 * GET /invoice/{id}
 */
export async function getInvoice(
  invoiceId: string,
): Promise<MayarApiResponse<MayarInvoice>> {
  return mayarFetch<MayarApiResponse<MayarInvoice>>({
    method: "GET",
    path: `/invoice/${invoiceId}`,
  });
}
