// ============================================================
// Mayar API — Barrel Export
// ============================================================

// Base client & errors
export { mayarFetch, MayarApiError } from "./client";

// Types
export type {
  MayarApiResponse,
  MayarPaginatedResponse,
  CreateInvoiceRequest,
  MayarInvoice,
  CreatePaymentRequest,
  MayarPayment,
  CreateCustomerRequest,
  MayarCustomer,
  CreateDiscountRequest,
  MayarDiscount,
  MayarTransaction,
  RegisterWebhookRequest,
  MayarWebhook,
  MayarWebhookEvent,
  AddCustomerCreditRequest,
  SpendCustomerCreditRequest,
  MayarCredit,
} from "./types";

// Resource modules
export { createInvoice, getInvoice } from "./invoice";
export { createPayment } from "./payment";
export { createCustomer, getCustomer } from "./customer";
export { createDiscount } from "./discount";
export { getPaidTransactions } from "./transaction";
export { registerWebhook } from "./webhook";
export { addCustomerCredit, spendCustomerCredit } from "./credits";
