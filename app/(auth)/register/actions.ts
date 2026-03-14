"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";

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
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors: RegisterFieldErrors = {};
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof RegisterFieldErrors;
      if (field) fieldErrors[field] = issue.message;
    }
    return { fieldErrors };
  }

  const { name, email, phone, password } = parsed.data;

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
