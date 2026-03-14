// ============================================================
// Mayar API — Type Definitions
// ============================================================

// ---------- Common ----------
export interface MayarApiResponse<T> {
  statusCode: number;
  messages: string;
  data: T;
}

export interface MayarPaginatedResponse<T> {
  statusCode: number;
  messages: string;
  data: T[];
  pagination: {
    total: number;
    currentPage: number;
    pageSize: number;
    totalPage: number;
  };
}

// ---------- Invoice ----------
export interface CreateInvoiceRequest {
  name: string;
  email: string;
  mobile: string;
  amount: number;
  description: string;
  redirectUrl: string;
  expiredAt: string;
  items: Array<{
    quantity: number;
    rate: number;
    description: string;
  }>;
  extraData: {
    noCustomer: string;
    idProd: string;
  };
}

export interface MayarInvoice {
  id: string;
  name: string;
  email: string;
  amount: number;
  status: "unpaid" | "paid" | "expired" | "cancelled";
  description: string | null;
  mobile: string | null;
  link: string;
  paymentUrl?: string;
  expiredAt: string | null;
  transactionId?: string;
  extraData?: {
    noCustomer?: string;
    idProd?: string;
  };
  createdAt: string;
  updatedAt: string;
  transaction: MayarTransaction | null;
  transactions?: MayarTransaction[];
}

// ---------- Payment ----------
export interface CreatePaymentRequest {
  name: string;
  amount: number;
  description?: string;
  redirectUrl?: string;
  email?: string;
  mobile?: string;
  expiredAt?: string;
}

export interface MayarPayment {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  status: string;
  link: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Customer ----------
export interface CreateCustomerRequest {
  name: string;
  email: string;
  mobile?: string;
}

export interface MayarCustomer {
  id: string;
  name: string;
  email: string;
  mobile: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Discount ----------
export interface CreateDiscountRequest {
  name: string;
  code: string;
  amount: number;
  type: "percentage" | "fixed";
  maxUsage?: number;
  startDate?: string;
  endDate?: string;
}

export interface MayarDiscount {
  id: string;
  name: string;
  code: string;
  amount: number;
  type: "percentage" | "fixed";
  maxUsage: number | null;
  usageCount: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Transaction ----------
export interface MayarTransaction {
  id: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  paymentMethod: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Webhook ----------
export interface RegisterWebhookRequest {
  url: string;
}

export interface MayarWebhook {
  id: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

export interface MayarWebhookEvent {
  event: "payment.completed" | "payment.failed" | "payment.expired";
  data: {
    id: string;
    status: string;
    amount: number;
    customerName: string;
    customerEmail: string;
    customerMobile: string | null;
    paymentMethod: string | null;
    paidAt: string | null;
    metadata: Record<string, unknown>;
  };
}

// ---------- Credit-Based Product (Post-MVP) ----------
export interface AddCustomerCreditRequest {
  customerId: string;
  productId: string;
  amount: number;
}

export interface SpendCustomerCreditRequest {
  customerId: string;
  productId: string;
  amount: number;
}

export interface MayarCredit {
  id: string;
  customerId: string;
  productId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}
