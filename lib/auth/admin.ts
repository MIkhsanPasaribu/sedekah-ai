// ============================================================
// Admin Auth Guard — Verifies user has admin role
// ============================================================

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

interface AdminUser {
  id: string;
  authId: string;
  email: string;
  name: string | null;
  role: string;
}

interface AdminCheckResult {
  user: AdminUser | null;
  error: { message: string; status: number } | null;
}

/**
 * Verifikasi user ter-autentikasi dan memiliki role admin.
 * Returns user data jika valid, error info jika tidak.
 */
export async function requireAdmin(): Promise<AdminCheckResult> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { user: null, error: { message: "Belum login", status: 401 } };
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: authUser.id },
    select: { id: true, authId: true, email: true, name: true, role: true },
  });

  if (!dbUser) {
    return {
      user: null,
      error: { message: "User tidak ditemukan", status: 404 },
    };
  }

  if (dbUser.role !== "admin") {
    return { user: null, error: { message: "Akses ditolak", status: 403 } };
  }

  return { user: dbUser, error: null };
}
