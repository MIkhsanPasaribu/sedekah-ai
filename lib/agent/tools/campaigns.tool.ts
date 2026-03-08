// ============================================================
// LangGraph Tool — Campaign Research (Database Query)
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const searchCampaignsSchema = z.object({
  category: z
    .enum(["yatim", "bencana", "kesehatan", "pendidikan", "pangan"])
    .optional()
    .describe("Kategori kampanye sesuai niat donatur"),
  minTrustScore: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe(
      "Minimum trust score (default: 55 untuk filter kampanye berisiko)",
    ),
  region: z.string().optional().describe("Daerah penerima manfaat"),
  limit: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .describe("Jumlah kampanye yang diambil (default: 10)"),
});

/**
 * Tool untuk mencari kampanye aktif dari database.
 * Digunakan oleh Node 3: RESEARCH.
 * Filter berdasarkan niat donatur, trust score, dan region.
 */
export const searchCampaignsTool = tool(
  async (input): Promise<string> => {
    try {
      const minScore = input.minTrustScore ?? 55;
      const maxResults = input.limit ?? 10;

      const campaigns = await prisma.campaign.findMany({
        where: {
          isActive: true,
          trustScore: { gte: minScore },
          ...(input.category && { category: input.category }),
          ...(input.region && {
            region: { contains: input.region, mode: "insensitive" as const },
          }),
        },
        orderBy: [
          { trustScore: "desc" },
          { collectedAmount: "asc" }, // Prioritaskan yang masih butuh banyak dana
        ],
        take: maxResults,
        include: {
          fraudAlerts: {
            select: {
              flagType: true,
              description: true,
              severity: true,
            },
          },
        },
      });

      const result = campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        laz: c.laz,
        lazVerified: c.lazVerified,
        targetAmount: c.targetAmount,
        collectedAmount: c.collectedAmount,
        gapAmount: c.targetAmount - c.collectedAmount,
        percentFunded: Math.round((c.collectedAmount / c.targetAmount) * 100),
        trustScore: c.trustScore,
        category: c.category,
        region: c.region,
        fraudFlags: c.fraudAlerts,
        endsAt: c.endsAt?.toISOString() ?? null,
      }));

      return JSON.stringify({
        success: true,
        count: result.length,
        campaigns: result,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: `Gagal mencari kampanye: ${(error as Error).message}`,
      });
    }
  },
  {
    name: "search_campaigns",
    description:
      "Mencari kampanye donasi aktif dari database. Bisa difilter berdasarkan kategori (yatim/bencana/kesehatan/pendidikan/pangan), minimum trust score, dan region. Mengembalikan kampanye diurutkan dari trust score tertinggi.",
    schema: searchCampaignsSchema,
  },
);
