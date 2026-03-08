import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const metadata = {
  title: "Chat AI — SEDEKAH.AI",
  description:
    "Percakapan dengan Amil AI untuk menghitung zakat dan menyalurkan sedekah.",
};

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/chat");
  }

  return <ChatInterface />;
}
