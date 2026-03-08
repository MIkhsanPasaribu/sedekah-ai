import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/shared/Navbar";
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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
}
