import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let email: string | null = null;

  if (user) {
    email = user.email ?? null;
    // Coba ambil nama dari database Prisma
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { name: true, email: true },
    });
    displayName =
      dbUser?.name ??
      (user.user_metadata?.full_name as string | undefined) ??
      null;
    if (!displayName && email) {
      displayName = email.split("@")[0];
    }
  }

  return <NavbarClient userName={displayName} userEmail={email} />;
}
