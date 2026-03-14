// ============================================================
// LangGraph Node 3: RESEARCH — Campaign Database Query
// ============================================================
// Query campaign DB, filter by niat/preferensi

import { buildAgentMessage } from "@/lib/agent/utils";
import { parseJsonWithSchema } from "@/lib/agent/utils";
import type { SedekahState, CampaignData } from "../state";
import { searchCampaignsTool } from "../tools/campaigns.tool";
import { z } from "zod";

const campaignSearchResultSchema = z.object({
  success: z.boolean(),
  count: z.number().int().nonnegative().default(0),
  campaigns: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        laz: z.string(),
        lazVerified: z.boolean(),
        targetAmount: z.number(),
        collectedAmount: z.number(),
        trustScore: z.number(),
        category: z.string(),
        region: z.string(),
        fraudFlags: z.array(z.unknown()).optional(),
        endsAt: z.string().nullable().optional(),
      }),
    )
    .default([]),
});

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

  const parsed = parseJsonWithSchema(result, campaignSearchResultSchema);

  if (!parsed || !parsed.success || parsed.count === 0) {
    return {
      messages: [
        buildAgentMessage(
          "Mohon maaf, saat ini belum ada kampanye aktif yang sesuai dengan preferensi Anda. Kami sedang mengupdate database kampanye. 🤲",
          "RESEARCH",
        ),
      ],
      campaigns: [],
    };
  }

  const campaigns: CampaignData[] = parsed.campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    laz: c.laz,
    lazVerified: c.lazVerified,
    targetAmount: c.targetAmount,
    collectedAmount: c.collectedAmount,
    trustScore: c.trustScore,
    category: c.category,
    region: c.region,
    isActive: true,
    fraudFlags: c.fraudFlags?.length ?? 0,
    endsAt: c.endsAt ?? null,
  }));

  const message = `🔍 Ditemukan **${campaigns.length} kampanye** yang sesuai dengan niat Anda. Sekarang saya akan menganalisis tingkat kepercayaan masing-masing kampanye...`;

  return {
    messages: [buildAgentMessage(message, "RESEARCH")],
    campaigns,
  };
}
