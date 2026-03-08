// ============================================================
// Validation — LAZ Partner schemas
// ============================================================

import { z } from "zod";

export const lazPartnerCreateSchema = z.object({
  name: z.string().min(1, "Nama LAZ diperlukan"),
  bankName: z.string().min(1, "Nama bank diperlukan"),
  accountNumber: z.string().min(1, "Nomor rekening diperlukan"),
  accountHolder: z.string().min(1, "Nama pemegang rekening diperlukan"),
  isActive: z.boolean().optional().default(true),
});

export const lazPartnerUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  bankName: z.string().min(1).optional(),
  accountNumber: z.string().min(1).optional(),
  accountHolder: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type LazPartnerCreateInput = z.infer<typeof lazPartnerCreateSchema>;
export type LazPartnerUpdateInput = z.infer<typeof lazPartnerUpdateSchema>;
