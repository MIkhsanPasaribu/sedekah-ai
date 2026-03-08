"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, LayoutDashboard, Heart, LogOut } from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";

const NAV_ITEMS = [
  { href: "/chat", label: "Chat AI", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Kampanye", icon: Heart },
];

interface NavbarClientProps {
  userName: string | null;
  userEmail: string | null;
}

function UserAvatar({ name }: { name: string | null }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gold-core text-brand-green-deep text-xs font-bold select-none">
      {initials}
    </div>
  );
}

export function NavbarClient({ userName, userEmail }: NavbarClientProps) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-brand-gold-pale bg-brand-green-deep shadow-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/images/logo.png"
            alt="SEDEKAH.AI"
            width={48}
            height={48}
            className="rounded-lg"
          />
          <span className="text-xl font-bold text-white">
            SEDEKAH<span className="text-brand-gold-core">.AI</span>
          </span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden items-center gap-1 sm:flex">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-green-mid text-white"
                    : "text-brand-green-ghost hover:bg-brand-green-mid/50 hover:text-white",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* User Info + Sign Out */}
        <div className="flex items-center gap-3">
          {(userName || userEmail) && (
            <div className="hidden items-center gap-2 sm:flex">
              <UserAvatar name={userName} />
              <div className="flex flex-col leading-tight">
                {userName && (
                  <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {userName}
                  </span>
                )}
                {userEmail && (
                  <span className="text-xs text-brand-green-ghost truncate max-w-[120px]">
                    {userEmail.length > 20
                      ? userEmail.split("@")[0] + "@…"
                      : userEmail}
                  </span>
                )}
              </div>
            </div>
          )}

          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-green-ghost transition-colors hover:bg-brand-green-mid/50 hover:text-white"
              title="Keluar"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </form>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex items-center justify-around border-t border-brand-green-mid py-1 sm:hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "text-brand-gold-core"
                  : "text-brand-green-ghost hover:text-white",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
