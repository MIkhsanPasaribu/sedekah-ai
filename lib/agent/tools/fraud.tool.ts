// ============================================================
// LangGraph Tool — Fraud Detection / Trust Scoring
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import type { FraudScore } from "../state";

const analyzeFraudSchema = z.object({
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
        fraudFlags: z.number().optional(),
        endsAt: z.string().nullable().optional(),
      }),
    )
    .describe("Daftar kampanye yang akan dianalisis"),
});

/**
 * Tool untuk menganalisis trust score kampanye.
 * Digunakan oleh Node 4: FRAUD DETECTOR.
 *
 * Analisis 4 dimensi:
 * 1. Narrative Score — deteksi manipulasi emosional
 * 2. Financial Score — kewajaran target & rasio
 * 3. Temporal Score — pola seasonal scam
 * 4. Identity Score — verifikasi LAZ
 */
export const analyzeFraudTool = tool(
  async (input): Promise<string> => {
    const scores: Record<string, FraudScore> = {};

    for (const campaign of input.campaigns) {
      // Identity Score: LAZ terverifikasi mendapat skor tinggi
      const identityScore = campaign.lazVerified ? 90 : 35;

      // Financial Score: Rasio collected/target + kewajaran target
      const fundingRatio =
        campaign.collectedAmount / Math.max(campaign.targetAmount, 1);
      const isReasonableTarget =
        campaign.targetAmount >= 1_000_000 &&
        campaign.targetAmount <= 50_000_000_000;
      const financialScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(
            (isReasonableTarget ? 50 : 20) +
              (fundingRatio > 0.1 && fundingRatio < 0.95 ? 30 : 10) +
              (campaign.fraudFlags && campaign.fraudFlags > 0 ? -20 : 20),
          ),
        ),
      );

      // Temporal Score: Kampanye mendekati deadline tanpa progress mencurigakan
      let temporalScore = 75;
      if (campaign.endsAt) {
        const daysLeft = Math.max(
          0,
          (new Date(campaign.endsAt).getTime() - Date.now()) / 86400000,
        );
        if (daysLeft < 7 && fundingRatio < 0.2) {
          temporalScore = 30; // Suspiciously low progress near deadline
        } else if (daysLeft > 30) {
          temporalScore = 85;
        }
      }

      // Narrative Score: simpified heuristic (in production, use LLM NLP)
      const narrativeRedFlags = [
        "darurat",
        "segera",
        "mendesak",
        "terakhir",
        "urgent",
        "tolong sekarang",
        "tidak ada waktu",
      ];
      const descLower = campaign.description.toLowerCase();
      const narrativeFlags = narrativeRedFlags.filter((flag) =>
        descLower.includes(flag),
      ).length;
      const narrativeScore = Math.max(20, 90 - narrativeFlags * 15);

      // Overall weighted score
      const overallScore = Math.round(
        narrativeScore * 0.25 +
          financialScore * 0.3 +
          temporalScore * 0.2 +
          identityScore * 0.25,
      );

      const flags: string[] = [];
      if (narrativeScore < 50) flags.push("narrative_manipulation");
      if (financialScore < 50) flags.push("financial_anomaly");
      if (temporalScore < 50) flags.push("seasonal_pattern");
      if (identityScore < 50) flags.push("identity_unverified");

      // Build reasoning
      const reasoning = buildReasoning({
        campaignName: campaign.name,
        overallScore,
        narrativeScore,
        financialScore,
        temporalScore,
        identityScore,
        flags,
        lazVerified: campaign.lazVerified,
        laz: campaign.laz,
      });

      scores[campaign.id] = {
        campaignId: campaign.id,
        overallScore,
        narrativeScore,
        financialScore,
        temporalScore,
        identityScore,
        reasoning,
        flags,
      };
    }

    return JSON.stringify({
      success: true,
      fraudScores: scores,
    });
  },
  {
    name: "analyze_fraud",
    description:
      "Menganalisis trust score kampanye berdasarkan 4 dimensi: narasi (deteksi manipulasi), finansial (kewajaran target), temporal (pola seasonal), dan identitas (verifikasi LAZ). Menghasilkan skor 0-100 per kampanye dengan reasoning.",
    schema: analyzeFraudSchema,
  },
);

function buildReasoning(data: {
  campaignName: string;
  overallScore: number;
  narrativeScore: number;
  financialScore: number;
  temporalScore: number;
  identityScore: number;
  flags: string[];
  lazVerified: boolean;
  laz: string;
}): string {
  const parts: string[] = [];

  if (data.overallScore >= 85) {
    parts.push(
      `Kampanye "${data.campaignName}" memiliki tingkat kepercayaan SANGAT TINGGI.`,
    );
  } else if (data.overallScore >= 70) {
    parts.push(
      `Kampanye "${data.campaignName}" memiliki tingkat kepercayaan BAIK.`,
    );
  } else if (data.overallScore >= 55) {
    parts.push(
      `Kampanye "${data.campaignName}" cukup terpercaya namun perlu perhatian.`,
    );
  } else {
    parts.push(
      `⚠️ Kampanye "${data.campaignName}" menunjukkan TANDA PERINGATAN.`,
    );
  }

  if (data.lazVerified) {
    parts.push(`LAZ "${data.laz}" terverifikasi resmi.`);
  } else {
    parts.push(`LAZ "${data.laz}" BELUM terverifikasi — harap berhati-hati.`);
  }

  if (data.flags.length > 0) {
    parts.push(`Flag: ${data.flags.join(", ")}.`);
  }

  return parts.join(" ");
}
