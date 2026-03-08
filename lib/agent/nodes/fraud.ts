// ============================================================
// LangGraph Node 4: FRAUD DETECTOR — Trust Scoring
// ============================================================
// NLP trust scoring, temporal + network analysis

import { AIMessage } from "@langchain/core/messages";
import type { SedekahState, FraudScore } from "../state";
import { analyzeFraudTool } from "../tools/fraud.tool";
import { getTrustScoreLabel } from "@/lib/utils";

export async function fraudDetectorNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const { campaigns } = state;

  if (!campaigns || campaigns.length === 0) {
    return {
      messages: [
        new AIMessage({
          content: "Tidak ada kampanye untuk dianalisis.",
          name: "FRAUD_DETECTOR",
        }),
      ],
      fraudScores: {},
    };
  }

  // Analyze fraud untuk semua kampanye
  const fraudResult = await analyzeFraudTool.invoke({
    campaigns: campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      laz: c.laz,
      lazVerified: c.lazVerified,
      targetAmount: c.targetAmount,
      collectedAmount: c.collectedAmount,
      trustScore: c.trustScore,
      category: c.category,
      fraudFlags: c.fraudFlags,
      endsAt: c.endsAt,
    })),
  });

  const parsed = JSON.parse(fraudResult);
  const fraudScores: Record<string, FraudScore> = parsed.fraudScores ?? {};

  // Build summary message
  const lines: string[] = [`🛡️ **Analisis Fraud Shield AI**\n`];

  const sortedCampaigns = campaigns
    .map((c) => ({
      ...c,
      score: fraudScores[c.id]?.overallScore ?? c.trustScore,
    }))
    .sort((a, b) => b.score - a.score);

  for (const campaign of sortedCampaigns) {
    const score = fraudScores[campaign.id];
    const trustLabel = getTrustScoreLabel(
      score?.overallScore ?? campaign.trustScore,
    );
    const scoreValue = score?.overallScore ?? campaign.trustScore;

    let emoji = "🟢";
    if (scoreValue < 40) emoji = "🔴";
    else if (scoreValue < 55) emoji = "🟠";
    else if (scoreValue < 70) emoji = "🟡";

    lines.push(
      `${emoji} **${campaign.name}** — Trust Score: **${scoreValue}/100** (${trustLabel})`,
    );

    if (score?.flags && score.flags.length > 0) {
      lines.push(`   ⚠️ Flag: ${score.flags.join(", ")}`);
    }
  }

  lines.push(``);
  lines.push(
    `Berdasarkan analisis ini, saya akan menyusun rekomendasi alokasi terbaik untuk Anda... 💡`,
  );

  return {
    messages: [
      new AIMessage({ content: lines.join("\n"), name: "FRAUD_DETECTOR" }),
    ],
    fraudScores,
  };
}
