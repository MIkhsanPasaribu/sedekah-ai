import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email wajib diisi")
    .email("Format email tidak valid")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1, "Password wajib diisi"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nama minimal 2 karakter")
      .max(100, "Nama maksimal 100 karakter")
      .transform((v) => v.trim()),
    email: z
      .string()
      .min(1, "Email wajib diisi")
      .email("Format email tidak valid")
      .transform((v) => v.trim().toLowerCase()),
    phone: z
      .string()
      .optional()
      .transform((v) => v?.trim() ?? "")
      .refine(
        (v) => !v || /^(\+62|62|0)8[1-9]\d{6,10}$/.test(v),
        "Format nomor HP tidak valid (contoh: 081234567890)",
      ),
    password: z
      .string()
      .min(8, "Password minimal 8 karakter")
      .refine(
        (v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v),
        "Password harus mengandung huruf dan angka",
      ),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
