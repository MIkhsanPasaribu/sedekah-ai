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

/**
 * Top-up kredit customer (Post-MVP).
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
 * Spend kredit customer (Post-MVP).
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
