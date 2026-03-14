// ============================================================
// Mayar API — Credit-Based Product Module (Post-MVP)
// ============================================================

import { mayarFetch } from "./client";
import type {
  AddCustomerCreditRequest,
  SpendCustomerCreditRequest,
  MayarApiResponse,
  MayarCredit,
} from "./types";

export interface MayarCreditBalance {
  customerId: string;
  balance: number;
}

/**
 * Get customer credit balance.
 * GET /creditbasedproduct/balance?customerId={customerId}
 */
export async function getCustomerCreditBalance(
  customerId: string,
): Promise<MayarApiResponse<MayarCreditBalance>> {
  return mayarFetch<MayarApiResponse<MayarCreditBalance>>({
    method: "GET",
    path: "/creditbasedproduct/balance",
    params: { customerId },
  });
}

/**
 * Top-up kredit customer.
 * POST /creditbasedproduct/addcustomercredit
 */
export async function addCustomerCredit(
  request: AddCustomerCreditRequest,
): Promise<MayarApiResponse<MayarCredit>> {
  return mayarFetch<MayarApiResponse<MayarCredit>>({
    method: "POST",
    path: "/creditbasedproduct/addcustomercredit",
    body: request as unknown as Record<string, unknown>,
  });
}

/**
 * Spend kredit customer.
 * POST /creditbasedproduct/spendcustomercredit
 */
export async function spendCustomerCredit(
  request: SpendCustomerCreditRequest,
): Promise<MayarApiResponse<MayarCredit>> {
  return mayarFetch<MayarApiResponse<MayarCredit>>({
    method: "POST",
    path: "/creditbasedproduct/spendcustomercredit",
    body: request as unknown as Record<string, unknown>,
  });
}
