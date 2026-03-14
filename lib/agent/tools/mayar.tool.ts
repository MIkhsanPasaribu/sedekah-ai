// ============================================================
// LangGraph Tool — Mayar Payment Integration
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createInvoice, getInvoice } from "@/lib/mayar";
import { pickInvoiceData } from "@/lib/mayar/invoice";
import { getRequiredAppBaseUrl } from "@/lib/env";

const createInvoiceSchema = z.object({
  name: z.string().describe("Nama donatur"),
  email: z.string().email().describe("Email donatur"),
  amount: z.number().positive().describe("Jumlah donasi dalam Rupiah"),
  description: z.string().describe("Deskripsi donasi (niat zakat/sedekah)"),
  mobile: z.string().optional().describe("Nomor telepon donatur"),
});

/**
 * Tool untuk membuat invoice pembayaran via Mayar API.
 * Digunakan oleh Node 6: PAYMENT EXECUTOR.
 */
export const createMayarInvoiceTool = tool(
  async (input): Promise<string> => {
    try {
      const appUrl = getRequiredAppBaseUrl();
      const expiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      const mobile = input.mobile?.trim() || "081234567890";
      const customerRef = `DON-${Date.now()}`;

      const response = await createInvoice({
        name: input.name,
        email: input.email,
        mobile,
        amount: input.amount,
        description: input.description,
        redirectUrl: `${appUrl}/success`,
        expiredAt: expiresAt,
        items: [
          {
            quantity: 1,
            rate: input.amount,
            description: input.description,
          },
        ],
        extraData: {
          noCustomer: customerRef,
          idProd: "SEDEKAH-AI-DONATION",
        },
      });

      if (response.statusCode !== 200) {
        throw new Error(
          `Mayar status ${response.statusCode}: ${response.messages}`,
        );
      }

      const invoice = pickInvoiceData(response.data);
      if (!invoice?.id) {
        throw new Error("Response Mayar tidak memiliki invoice id");
      }
      const paymentLink = invoice.link || invoice.paymentUrl;
      if (!paymentLink) {
        throw new Error("Response Mayar tidak memiliki payment link");
      }

      return JSON.stringify({
        success: true,
        invoiceId: invoice.id,
        paymentLink,
        amount: invoice.amount,
        status: invoice.status,
      });
    } catch (error) {
      console.error("[create_mayar_invoice] failed:", error);
      return JSON.stringify({
        success: false,
        error: `Gagal membuat invoice: ${(error as Error).message}`,
      });
    }
  },
  {
    name: "create_mayar_invoice",
    description:
      "Membuat invoice pembayaran di Mayar untuk donasi zakat/sedekah. Menghasilkan link payment yang bisa diklik user.",
    schema: createInvoiceSchema,
  },
);

const checkInvoiceSchema = z.object({
  invoiceId: z.string().describe("ID invoice Mayar yang akan dicek statusnya"),
});

/**
 * Tool untuk mengecek status invoice Mayar.
 */
export const checkMayarInvoiceTool = tool(
  async (input): Promise<string> => {
    try {
      const response = await getInvoice(input.invoiceId);
      const invoice = pickInvoiceData(response.data);

      if (!invoice) {
        throw new Error("Invoice tidak ditemukan");
      }

      return JSON.stringify({
        success: true,
        invoiceId: invoice.id,
        status: invoice.status,
        amount: invoice.amount,
        link: invoice.link || invoice.paymentUrl,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Gagal mengecek invoice: ${(error as Error).message}`,
      });
    }
  },
  {
    name: "check_mayar_invoice",
    description:
      "Mengecek status pembayaran invoice Mayar (unpaid/paid/expired/cancelled).",
    schema: checkInvoiceSchema,
  },
);
