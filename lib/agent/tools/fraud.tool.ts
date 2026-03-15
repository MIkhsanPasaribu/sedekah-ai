// ============================================================
// LangGraph Tool — Fraud Detection / Trust Scoring
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import type { FraudScore } from "../state";
import { invokeTaskWithModelFallback } from "@/lib/models/factory";
import { getAiRuntimeConfig } from "@/lib/env";
import { narrativeAnalysisSchema } from "../schemas/fraud.schema";

const aiRuntime = getAiRuntimeConfig();

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

// ── Cross-Campaign Similarity Detection ──────────────────────

/**
 * Simple word-overlap similarity between two descriptions (Jaccard index).
 * Returns a value 0–1 where 1 = identical word sets.
 */
function descriptionSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) intersection += 1;
  }
  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Detect campaigns from the same LAZ with suspiciously similar descriptions (>0.8 Jaccard).
 * Returns a Set of campaign IDs that are flagged as potential duplicates.
 */
function detectDuplicateCampaigns(
  campaigns: Array<{ id: string; laz: string; description: string }>,
): Set<string> {
  const flagged = new Set<string>();
  for (let i = 0; i < campaigns.length; i++) {
    for (let j = i + 1; j < campaigns.length; j++) {
      if (
        campaigns[i].laz === campaigns[j].laz &&
        descriptionSimilarity(campaigns[i].description, campaigns[j].description) > 0.8
      ) {
        flagged.add(campaigns[i].id);
        flagged.add(campaigns[j].id);
      }
    }
  }
  return flagged;
}

/**
 * Social proof score: campaigns with higher donation density
 * (collectedAmount relative to average) get a trust bonus.
 */
function socialProofBonus(
  collectedAmount: number,
  averageCollected: number,
): number {
  if (averageCollected <= 0) return 0;
  const ratio = collectedAmount / averageCollected;
  // Capped bonus: max +10 points for campaigns with 2x+ average donations
  return Math.min(10, Math.round(ratio * 5));
}

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

    // Pre-compute cross-campaign signals
    const duplicateCampaigns = detectDuplicateCampaigns(input.campaigns);
    const totalCollected = input.campaigns.reduce(
      (sum, c) => sum + c.collectedAmount,
      0,
    );
    const averageCollected =
      input.campaigns.length > 0
        ? totalCollected / input.campaigns.length
        : 0;

    await Promise.all(
      input.campaigns.map(async (campaign) => {
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

        // Narrative Score: Hybrid rule-based (40%) + LLM NLP analysis (60%)
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
        const ruleBasedNarrativeScore = Math.max(20, 90 - narrativeFlags * 15);

        // LLM-based narrative analysis (temp=0 for determinism, fallback to rule-based)
        const llmNarrativeResult = await invokeTaskWithModelFallback(
          "agent_fraud_narrative",
          {
            temperature: 0,
            timeoutMs: aiRuntime.llmTimeoutMs,
            maxRetries: aiRuntime.llmMaxRetries,
            initialRetryDelayMs: aiRuntime.llmInitialRetryDelayMs,
            operationName: "fraud.narrative_analysis",
          },
          (llm) =>
            llm
              .withStructuredOutput(narrativeAnalysisSchema)
              .invoke([
                new SystemMessage(
                  "Anda adalah analis penipuan donasi online. Analisis apakah teks kampanye menggunakan teknik manipulasi psikologis seperti FOMO, urgensi palsu, atau klaim berlebihan. Berikan skor manipulasi 0-100 di mana 0=tidak ada manipulasi (terpercaya) dan 100=sangat manipulatif (berisiko tinggi).",
                ),
                new HumanMessage(
                  `Nama kampanye: ${campaign.name}\n\nDeskripsi: ${campaign.description}`,
                ),
              ]),
        ).catch(() => null);

        // Hybrid: 40% rule-based + 60% LLM (manipulationScore inverted to trust scale)
        const llmTrustScore = llmNarrativeResult
          ? 100 - llmNarrativeResult.manipulationScore
          : ruleBasedNarrativeScore;
        const narrativeScore = Math.round(
          0.4 * ruleBasedNarrativeScore + 0.6 * llmTrustScore,
        );

        // Overall weighted score (with social proof bonus and duplicate penalty)
        const duplicatePenalty = duplicateCampaigns.has(campaign.id) ? -10 : 0;

        // Social proof: high-donation campaigns get bonus, low get penalty
        const spBonus = socialProofBonus(
          campaign.collectedAmount,
          averageCollected,
        );

        const overallScore = Math.max(
          0,
          Math.min(
            100,
            Math.round(
              narrativeScore * 0.25 +
                financialScore * 0.3 +
                temporalScore * 0.2 +
                identityScore * 0.25 +
                spBonus +
                duplicatePenalty,
            ),
          ),
        );

        const flags: string[] = [];
        if (narrativeScore < 50) flags.push("narrative_manipulation");
        if (financialScore < 50) flags.push("financial_anomaly");
        if (temporalScore < 50) flags.push("seasonal_pattern");
        if (identityScore < 50) flags.push("identity_unverified");
        if (duplicateCampaigns.has(campaign.id))
          flags.push("duplicate_campaign");
        if (spBonus <= 1 && campaign.collectedAmount > 0)
          flags.push("low_social_proof");

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
      }),
    );

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
