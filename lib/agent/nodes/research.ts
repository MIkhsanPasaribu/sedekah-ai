// ============================================================
// LangGraph Node 3: RESEARCH — Campaign Database Query
// ============================================================
// Query campaign DB, filter by niat/preferensi

import { AIMessage } from "@langchain/core/messages";
import type { SedekahState, CampaignData } from "../state";
import { searchCampaignsTool } from "../tools/campaigns.tool";

export async function researchNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const { donorIntent } = state;

  // Map donorIntent ke campaign category
  const categoryMap: Record<string, string> = {
    zakat_mal: "", // Semua kategori
    zakat_fitrah: "pangan",
    sedekah: "", // Semua kategori
    infaq: "", // Semua kategori
    wakaf: "pendidikan",
    bencana: "bencana",
    yatim: "yatim",
    kesehatan: "kesehatan",
    pendidikan: "pendidikan",
    pangan: "pangan",
  };

  const category = donorIntent ? categoryMap[donorIntent] : undefined;

  // Search campaigns dengan minimum trust score 40 agar bisa menunjukkan variasi
  const searchParams: Record<string, unknown> = {
    minTrustScore: 40,
    limit: 10,
  };

  if (category) {
    searchParams.category = category;
  }

  const result = await searchCampaignsTool.invoke(
    searchParams as {
      category?: "yatim" | "bencana" | "kesehatan" | "pendidikan" | "pangan";
      minTrustScore?: number;
      limit?: number;
    },
  );

  const parsed = JSON.parse(result);

  if (!parsed.success || parsed.count === 0) {
    return {
      messages: [
        new AIMessage({
          content:
            "Mohon maaf, saat ini belum ada kampanye aktif yang sesuai dengan preferensi Anda. Kami sedang mengupdate database kampanye. 🤲",
          name: "RESEARCH",
        }),
      ],
      campaigns: [],
    };
  }

  const campaigns: CampaignData[] = parsed.campaigns.map(
    (c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string,
      description: c.description as string,
      laz: c.laz as string,
      lazVerified: c.lazVerified as boolean,
      targetAmount: c.targetAmount as number,
      collectedAmount: c.collectedAmount as number,
      trustScore: c.trustScore as number,
      category: c.category as string,
      region: c.region as string,
      isActive: true,
      fraudFlags: ((c.fraudFlags as Array<unknown>) ?? []).length,
      endsAt: c.endsAt as string | null,
    }),
  );

  const message = `🔍 Ditemukan **${campaigns.length} kampanye** yang sesuai dengan niat Anda. Sekarang saya akan menganalisis tingkat kepercayaan masing-masing kampanye...`;

  return {
    messages: [new AIMessage({ content: message, name: "RESEARCH" })],
    campaigns,
  };
}
