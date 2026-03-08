// ============================================================
// Mayar API — Customer Module
// ============================================================

import { mayarFetch } from "./client";
import type {
  CreateCustomerRequest,
  MayarApiResponse,
  MayarCustomer,
} from "./types";

/**
 * Register donatur baru di Mayar.
 * POST /customer/create
 */
export async function createCustomer(
  request: CreateCustomerRequest,
): Promise<MayarApiResponse<MayarCustomer>> {
  return mayarFetch<MayarApiResponse<MayarCustomer>>({
    method: "POST",
    path: "/customer/create",
    body: request as unknown as Record<string, unknown>,
  });
}

/**
 * Ambil profil donatur berdasarkan ID.
 * GET /customer/{id}
 */
export async function getCustomer(
  customerId: string,
): Promise<MayarApiResponse<MayarCustomer>> {
  return mayarFetch<MayarApiResponse<MayarCustomer>>({
    method: "GET",
    path: `/customer/${customerId}`,
  });
}
