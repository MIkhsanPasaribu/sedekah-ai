"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  MessageSquare,
  LayoutDashboard,
  Heart,
  LogOut,
  ChevronUp,
  Plus,
  Clock,
} from "lucide-react";
import { signOut } from "@/app/(auth)/login/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/chat", label: "Chat AI", icon: MessageSquare },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/campaigns", label: "Kampanye", icon: Heart },
];

interface AppSidebarProps {
  userName: string | null;
  userEmail: string | null;
}

interface ConversationItem {
  threadId: string;
  title: string;
  updatedAt: string;
}

export function AppSidebar({ userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return;
        const data = await res.json();
        setConversations(data.conversations ?? []);
      } catch {
        // Non-fatal
      }
    }
    load();
  }, [pathname]);

  const initials = userName
    ? userName
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase() ?? "")
        .join("")
    : "?";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                <Image
                  src="/images/logo.png"
                  alt="SEDEKAH.AI"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-heading font-bold text-sidebar-foreground">
                  SEDEKAH<span className="text-brand-gold-core">.AI</span>
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  Amil Digital
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Conversation History */}
        {conversations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
              <Clock className="mr-1 inline size-3" />
              Riwayat Chat
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/chat" />}
                    tooltip="Percakapan Baru"
                  >
                    <Plus className="size-4" />
                    <span>Percakapan Baru</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {conversations.map((conv) => {
                  const threadUrl = `/chat?thread=${encodeURIComponent(conv.threadId)}`;
                  const isActive =
                    pathname === "/chat" &&
                    typeof window !== "undefined" &&
                    new URLSearchParams(window.location.search).get(
                      "thread",
                    ) === conv.threadId;
                  return (
                    <SidebarMenuItem key={conv.threadId}>
                      <SidebarMenuButton
                        render={<Link href={threadUrl} />}
                        isActive={isActive}
                        tooltip={conv.title}
                      >
                        <MessageSquare className="size-4 shrink-0" />
                        <span className="truncate">{conv.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                  />
                }
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-brand-gold-core text-brand-green-deep text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-sidebar-foreground">
                    {userName ?? "Pengguna"}
                  </span>
                  <span className="truncate text-xs text-sidebar-foreground/60">
                    {userEmail
                      ? userEmail.length > 20
                        ? userEmail.split("@")[0] + "@…"
                        : userEmail
                      : ""}
                  </span>
                </div>
                <ChevronUp className="ml-auto size-4 text-sidebar-foreground/50" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem>
                  <form action={signOut} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 text-sm"
                    >
                      <LogOut className="size-4" />
                      Keluar
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
