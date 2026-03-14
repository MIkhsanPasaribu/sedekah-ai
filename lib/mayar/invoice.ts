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
): Promise<MayarApiResponse<MayarInvoice[] | MayarInvoice>> {
  return mayarFetch<MayarApiResponse<MayarInvoice[] | MayarInvoice>>({
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
): Promise<MayarApiResponse<MayarInvoice[] | MayarInvoice>> {
  return mayarFetch<MayarApiResponse<MayarInvoice[] | MayarInvoice>>({
    method: "GET",
    path: `/invoice/${invoiceId}`,
  });
}

export function pickInvoiceData(
  data: MayarInvoice[] | MayarInvoice | null | undefined,
): MayarInvoice | null {
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
}
