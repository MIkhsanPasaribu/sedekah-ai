import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { MobileBottomNav } from "@/components/shared/MobileBottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName: string | null = null;
  let email: string | null = null;
  let role: string | null = null;

  if (user) {
    email = user.email ?? null;
    const dbUser = await prisma.user.findUnique({
      where: { authId: user.id },
      select: { name: true, email: true, role: true },
    });
    displayName =
      dbUser?.name ??
      (user.user_metadata?.full_name as string | undefined) ??
      null;
    if (!displayName && email) {
      displayName = email.split("@")[0];
    }
    role = dbUser?.role ?? null;
  }

  return (
    <SidebarProvider>
      <AppSidebar userName={displayName} userEmail={email} userRole={role} />
      <SidebarInset className="min-h-screen">
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </SidebarInset>
      <MobileBottomNav />
    </SidebarProvider>
  );
}
