// ============================================================
// LangGraph Node 4: FRAUD DETECTOR — Trust Scoring
// ============================================================
// NLP trust scoring, temporal + network analysis

import { buildAgentMessage } from "@/lib/agent/utils";
import { parseJsonWithSchema } from "@/lib/agent/utils";
import type { SedekahState, FraudScore } from "../state";
import { analyzeFraudTool } from "../tools/fraud.tool";
import { getTrustScoreLabel } from "@/lib/utils";
import { getFraudAnalysisTopN } from "@/lib/env";
import { fraudToolResultSchema } from "../schemas/fraud.schema";

export async function fraudDetectorNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const { campaigns } = state;

  if (!campaigns || campaigns.length === 0) {
    return {
      messages: [
        buildAgentMessage(
          "Tidak ada kampanye untuk dianalisis.",
          "FRAUD_DETECTOR",
        ),
      ],
      fraudScores: {},
    };
  }

  // Keep latency predictable by analyzing only the most relevant campaigns.
  const fraudAnalysisTopN = getFraudAnalysisTopN();
  const prioritizedCampaigns = [...campaigns].sort((a, b) => {
    const unmetRatioA =
      (a.targetAmount - a.collectedAmount) / Math.max(a.targetAmount, 1);
    const unmetRatioB =
      (b.targetAmount - b.collectedAmount) / Math.max(b.targetAmount, 1);

    const relevanceA = a.trustScore * 0.7 + unmetRatioA * 30;
    const relevanceB = b.trustScore * 0.7 + unmetRatioB * 30;

    return relevanceB - relevanceA;
  });

  const campaignsForAnalysis = prioritizedCampaigns.slice(0, fraudAnalysisTopN);
  const skippedCount = Math.max(
    0,
    campaigns.length - campaignsForAnalysis.length,
  );

  // Analyze fraud untuk top-N kampanye paling relevan
  const fraudResult = await analyzeFraudTool.invoke({
    campaigns: campaignsForAnalysis.map((c) => ({
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

  const parsed = parseJsonWithSchema(fraudResult, fraudToolResultSchema);
  const fraudScores: Record<string, FraudScore> = parsed?.fraudScores ?? {};

  // Build summary message
  const lines: string[] = [`🛡️ **Analisis Fraud Shield AI**\n`];
  lines.push(
    `Menganalisis **${campaignsForAnalysis.length}** kampanye paling relevan untuk menjaga kecepatan respons.`,
  );
  if (skippedCount > 0) {
    lines.push(
      `Sebanyak **${skippedCount}** kampanye lainnya akan tetap dipertimbangkan pada tahap rekomendasi menggunakan baseline trust score.`,
    );
  }
  lines.push("");

  const sortedCampaigns = campaignsForAnalysis
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
    messages: [buildAgentMessage(lines.join("\n"), "FRAUD_DETECTOR")],
    fraudScores,
  };
}
