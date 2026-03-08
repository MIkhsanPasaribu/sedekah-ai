import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CampaignForm } from "@/components/campaigns/CampaignForm";

export const metadata = {
  title: "Buat Kampanye — SEDEKAH.AI",
  description: "Buat kampanye donasi baru untuk disalurkan lewat SEDEKAH.AI.",
};

export default async function NewCampaignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <CampaignForm />;
}
