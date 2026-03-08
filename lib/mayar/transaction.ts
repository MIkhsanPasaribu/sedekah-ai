// ============================================================
// Mayar API — Transaction Module
// ============================================================

import { mayarFetch } from "./client";
import type { MayarPaginatedResponse, MayarTransaction } from "./types";

interface GetPaidTransactionsParams {
  page?: number;
  pageSize?: number;
}

/**
 * Ambil daftar transaksi yang sudah dibayar.
 * GET /transaction/paid
 */
export async function getPaidTransactions(
  params?: GetPaidTransactionsParams,
): Promise<MayarPaginatedResponse<MayarTransaction>> {
  const queryParams: Record<string, string> = {};
  if (params?.page) queryParams.page = params.page.toString();
  if (params?.pageSize) queryParams.pageSize = params.pageSize.toString();

  return mayarFetch<MayarPaginatedResponse<MayarTransaction>>({
    method: "GET",
    path: "/transaction/paid",
    params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  });
}
