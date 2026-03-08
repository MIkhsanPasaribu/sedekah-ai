import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatPageClient } from "./ChatPageClient";

export const metadata = {
  title: "Chat AI — SEDEKAH.AI",
  description:
    "Percakapan dengan Amil AI untuk menghitung zakat dan menyalurkan sedekah.",
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ thread?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/chat");
  }

  const params = await searchParams;

  return <ChatPageClient initialThreadId={params.thread ?? null} />;
}
