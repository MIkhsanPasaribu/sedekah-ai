// ============================================================
// Zod Validation Schemas — Donation & Autopilot
// ============================================================

import { z } from "zod";

export const autopilotConfigSchema = z.object({
  monthlyAmount: z
    .number()
    .int("Jumlah harus bilangan bulat")
    .min(10_000, "Minimum donasi otomatis Rp 10.000")
    .max(100_000_000, "Maksimum donasi otomatis Rp 100.000.000"),
  categories: z
    .array(z.enum(["yatim", "bencana", "kesehatan", "pendidikan", "pangan"]))
    .min(1, "Pilih minimal 1 kategori")
    .max(5, "Maksimal 5 kategori"),
  isActive: z.boolean(),
});

export const donationStatusQuerySchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID diperlukan"),
});

export type AutopilotConfigInput = z.infer<typeof autopilotConfigSchema>;
export type DonationStatusQuery = z.infer<typeof donationStatusQuerySchema>;
