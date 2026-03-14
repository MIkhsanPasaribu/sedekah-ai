// ============================================================
// Zod Validation Schemas — Donation & Autopilot
// ============================================================

import { z } from "zod";

export const DONATION_LIMITS = {
  MIN_AMOUNT: 10_000,
  MAX_AMOUNT: 100_000_000,
  MAX_MESSAGE_LENGTH: 500,
} as const;

export const autopilotConfigSchema = z.object({
  monthlyAmount: z
    .number()
    .int("Jumlah harus bilangan bulat")
    .min(DONATION_LIMITS.MIN_AMOUNT, "Minimum donasi otomatis Rp 10.000")
    .max(DONATION_LIMITS.MAX_AMOUNT, "Maksimum donasi otomatis Rp 100.000.000"),
  categories: z
    .array(z.enum(["yatim", "bencana", "kesehatan", "pendidikan", "pangan"]))
    .min(1, "Pilih minimal 1 kategori")
    .max(5, "Maksimal 5 kategori"),
  isActive: z.boolean(),
});

export const donationStatusQuerySchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID diperlukan"),
});

export const directDonationSchema = z.object({
  campaignId: z.string().uuid("ID kampanye tidak valid"),
  amount: z
    .number()
    .int("Jumlah harus bilangan bulat")
    .min(DONATION_LIMITS.MIN_AMOUNT, "Minimum donasi Rp 10.000")
    .max(DONATION_LIMITS.MAX_AMOUNT, "Maksimum donasi Rp 100.000.000"),
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(100, "Nama terlalu panjang"),
  email: z.string().trim().toLowerCase().email("Format email tidak valid"),
  message: z
    .string()
    .max(DONATION_LIMITS.MAX_MESSAGE_LENGTH, "Pesan maksimal 500 karakter")
    .optional(),
});

export const directDonationFormSchema = directDonationSchema.omit({
  campaignId: true,
});

export function validateDirectDonationForm(input: {
  name: string;
  email: string;
  amount: number;
  message?: string;
}):
  | { success: true; data: z.infer<typeof directDonationFormSchema> }
  | {
      success: false;
      error: string;
    } {
  const parsed = directDonationFormSchema.safeParse({
    name: input.name,
    email: input.email,
    amount: input.amount,
    message: input.message,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Data donasi tidak valid",
    };
  }

  return { success: true, data: parsed.data };
}

export type AutopilotConfigInput = z.infer<typeof autopilotConfigSchema>;
export type DonationStatusQuery = z.infer<typeof donationStatusQuerySchema>;
export type DirectDonationInput = z.infer<typeof directDonationSchema>;
export type DirectDonationFormInput = z.infer<typeof directDonationFormSchema>;
