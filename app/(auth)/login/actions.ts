"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface LoginFieldErrors {
  email?: string;
  password?: string;
}

export interface LoginResult {
  error?: string;
  fieldErrors?: LoginFieldErrors;
}

export async function signInWithEmail(
  formData: FormData,
): Promise<LoginResult | void> {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const password = (formData.get("password") as string) ?? "";

  const fieldErrors: LoginFieldErrors = {};

  if (!email) {
    fieldErrors.email = "Email wajib diisi";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fieldErrors.email = "Format email tidak valid";
  }

  if (!password) {
    fieldErrors.password = "Password wajib diisi";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (
      error.message.includes("Invalid login credentials") ||
      error.message.includes("invalid_credentials")
    ) {
      return { error: "Email atau password salah. Silakan periksa kembali." };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        error:
          "Email belum dikonfirmasi. Silakan cek inbox Anda dan klik tautan konfirmasi.",
      };
    }
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }

  redirect("/chat");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
