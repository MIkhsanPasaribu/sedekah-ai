// ============================================================
// Validation — Disbursement schemas
// ============================================================

import { z } from "zod";

export const disbursementCreateSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID diperlukan"),
  lazPartnerId: z.string().optional(),
  amount: z.number().int().positive("Jumlah harus lebih dari 0"),
  recipientAccount: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  notes: z.string().optional(),
});

export const disbursementUpdateSchema = z.object({
  status: z.enum(["processing", "completed", "verified"]).optional(),
  transferProof: z.string().optional(),
  bankName: z.string().optional(),
  accountHolder: z.string().optional(),
  notes: z.string().optional(),
});

export type DisbursementCreateInput = z.infer<typeof disbursementCreateSchema>;
export type DisbursementUpdateInput = z.infer<typeof disbursementUpdateSchema>;
