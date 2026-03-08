"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface RegisterFieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

export interface RegisterResult {
  error?: string;
  fieldErrors?: RegisterFieldErrors;
}

export async function registerWithEmail(
  formData: FormData,
): Promise<RegisterResult | void> {
  const name = ((formData.get("name") as string) ?? "").trim();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const phone = ((formData.get("phone") as string) ?? "").trim();
  const password = (formData.get("password") as string) ?? "";
  const confirmPassword = (formData.get("confirmPassword") as string) ?? "";

  const fieldErrors: RegisterFieldErrors = {};

  // Validasi nama
  if (!name) {
    fieldErrors.name = "Nama lengkap wajib diisi";
  } else if (name.length < 2) {
    fieldErrors.name = "Nama minimal 2 karakter";
  } else if (name.length > 100) {
    fieldErrors.name = "Nama maksimal 100 karakter";
  }

  // Validasi email
  if (!email) {
    fieldErrors.email = "Email wajib diisi";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Format email tidak valid";
  }

  // Validasi nomor telepon (opsional tapi jika diisi harus valid)
  if (phone && !/^(\+62|62|0)8[1-9]\d{6,10}$/.test(phone)) {
    fieldErrors.phone = "Format nomor HP tidak valid (contoh: 081234567890)";
  }

  // Validasi password
  if (!password) {
    fieldErrors.password = "Password wajib diisi";
  } else if (password.length < 8) {
    fieldErrors.password = "Password minimal 8 karakter";
  } else if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    fieldErrors.password = "Password harus mengandung huruf dan angka";
  }

  // Validasi konfirmasi password
  if (!confirmPassword) {
    fieldErrors.confirmPassword = "Konfirmasi password wajib diisi";
  } else if (password !== confirmPassword) {
    fieldErrors.confirmPassword = "Password tidak cocok";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  // Daftarkan ke Supabase Auth
  const supabase = await createClient();
  const { data, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        phone: phone || null,
      },
    },
  });

  if (authError) {
    if (
      authError.message.includes("already registered") ||
      authError.message.includes("User already registered")
    ) {
      return {
        fieldErrors: {
          email: "Email ini sudah terdaftar. Silakan masuk.",
        },
      };
    }
    return { error: "Pendaftaran gagal. Silakan coba lagi." };
  }

  // Buat record user di database Prisma segera setelah daftar
  if (data.user) {
    try {
      await prisma.user.upsert({
        where: { authId: data.user.id },
        update: {
          email,
          name,
          mobile: phone || null,
        },
        create: {
          authId: data.user.id,
          email,
          name,
          mobile: phone || null,
          ramadhanStreak: 0,
        },
      });
    } catch {
      // Jangan fail pendaftaran jika Prisma upsert gagal,
      // akan dibuat ulang saat user pertama login ke dashboard
    }
  }

  // Jika Supabase email confirmation aktif, user.session akan null
  // dan user perlu konfirmasi email dulu
  if (!data.session) {
    redirect(
      "/login?msg=Akun berhasil dibuat! Cek email Anda untuk konfirmasi, lalu masuk.",
    );
  }

  redirect("/chat");
}
