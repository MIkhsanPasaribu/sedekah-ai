// ============================================================
// LangGraph Tool — Mayar Payment Integration
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createInvoice, getInvoice } from "@/lib/mayar";

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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const response = await createInvoice({
        name: input.name,
        email: input.email,
        amount: input.amount,
        description: input.description,
        mobile: input.mobile,
        redirectUrl: `${appUrl}/success`,
      });

      return JSON.stringify({
        success: true,
        invoiceId: response.data.id,
        paymentLink: response.data.link,
        amount: response.data.amount,
        status: response.data.status,
      });
    } catch (error) {
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

      return JSON.stringify({
        success: true,
        invoiceId: response.data.id,
        status: response.data.status,
        amount: response.data.amount,
        link: response.data.link,
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
