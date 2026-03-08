// ============================================================
// Zod Validation Schemas — Campaign
// ============================================================

import { z } from "zod";

export const VALID_CATEGORIES = [
  "yatim",
  "bencana",
  "kesehatan",
  "pendidikan",
  "pangan",
] as const;

export const campaignCreateSchema = z.object({
  name: z
    .string()
    .min(5, "Nama kampanye minimal 5 karakter")
    .max(200, "Nama kampanye maksimal 200 karakter")
    .trim(),
  description: z
    .string()
    .min(20, "Deskripsi minimal 20 karakter")
    .max(5000, "Deskripsi maksimal 5000 karakter")
    .trim(),
  category: z.enum(VALID_CATEGORIES, {
    error: "Kategori tidak valid",
  }),
  region: z
    .string()
    .min(2, "Wilayah minimal 2 karakter")
    .max(100, "Wilayah maksimal 100 karakter")
    .trim(),
  laz: z
    .string()
    .min(3, "Nama LAZ/organisasi minimal 3 karakter")
    .max(200, "Nama LAZ maksimal 200 karakter")
    .trim(),
  targetAmount: z
    .number()
    .int("Target donasi harus bilangan bulat")
    .min(100_000, "Target donasi minimal Rp 100.000")
    .max(100_000_000_000, "Target donasi terlalu besar"),
  endsAt: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // optional
        const date = new Date(val);
        return date > new Date();
      },
      { message: "Tanggal berakhir harus di masa mendatang" },
    ),
});

export const campaignUpdateSchema = z.object({
  name: z.string().min(5).max(200).trim().optional(),
  description: z.string().min(20).max(5000).trim().optional(),
  isActive: z.boolean().optional(),
  trustScore: z.number().int().min(0).max(100).optional(),
});

export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.infer<typeof campaignUpdateSchema>;
