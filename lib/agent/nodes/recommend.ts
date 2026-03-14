// ============================================================
// LangGraph Node 5: RECOMMEND — Optimal Allocation + Reasoning
// ============================================================
// Alokasi optimal berdasarkan urgency + gap + donorIntent
// Transplant RUANG HATI: Attach hadith kontekstual per rekomendasi

import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { buildAgentMessage } from "@/lib/agent/utils";
import { sanitizeModelOutput } from "@/lib/agent/utils";
import { invokeWithRetryAndTimeout } from "@/lib/agent/utils";
import { parseJsonWithSchema } from "@/lib/agent/utils";
import { ChatGroq } from "@langchain/groq";
import type { SedekahState, Recommendation, AllocationItem } from "../state";
import { getIslamicContextTool } from "../tools/islamic-context.tool";
import { formatRupiah } from "@/lib/utils";
import { getAiRuntimeConfig } from "@/lib/env";
import { z } from "zod";

const personalizationLlm = new ChatGroq({
  model: "meta-llama/llama-4-scout-17b-16e-instruct",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});
const aiRuntime = getAiRuntimeConfig();
const islamicContextResultSchema = z.object({
  success: z.boolean(),
  quote: z
    .object({
      reference: z.string(),
      translation: z.string(),
    })
    .optional(),
});

export async function recommendNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const { campaigns, fraudScores, zakatBreakdown, donorIntent } = state;

  // Tentukan total amount: gunakan kalkulasi zakat, atau nominal custom untuk sedekah/infaq
  const totalAmount = zakatBreakdown?.totalKewajiban ?? state.customAmount ?? 0;

  if (!campaigns || campaigns.length === 0) {
    return {
      messages: [
        buildAgentMessage(
          "Mohon maaf, tidak ada kampanye yang bisa direkomendasikan saat ini.",
          "RECOMMEND",
        ),
      ],
    };
  }

  // Filter kampanye dengan trust score tinggi (>= 55)
  const trustedCampaigns = campaigns
    .filter((c) => {
      const score = fraudScores[c.id]?.overallScore ?? c.trustScore;
      return score >= 55;
    })
    .sort((a, b) => {
      const scoreA = fraudScores[a.id]?.overallScore ?? a.trustScore;
      const scoreB = fraudScores[b.id]?.overallScore ?? b.trustScore;
      // Sort by urgency (gap to target) then trust score
      const gapA = a.targetAmount - a.collectedAmount;
      const gapB = b.targetAmount - b.collectedAmount;
      return scoreB - scoreA || gapB - gapA;
    });

  if (trustedCampaigns.length === 0) {
    return {
      messages: [
        buildAgentMessage(
          "⚠️ Mohon maaf, semua kampanye yang ditemukan memiliki tingkat risiko tinggi. Kami sarankan untuk menunggu kampanye terverifikasi tersedia. Keselamatan donasi Anda adalah prioritas kami. 🤲",
          "RECOMMEND",
        ),
      ],
    };
  }

  if (totalAmount <= 0) {
    return {
      messages: [
        buildAgentMessage(
          [
            "Alhamdulillah, kampanye tepercaya sudah saya siapkan. ✨",
            "",
            "Sebelum lanjut ke pembayaran, mohon sebutkan nominal donasi Anda terlebih dahulu.",
            "",
            "Contoh: `Saya ingin donasi Rp 100.000` atau `Nominal saya 250 ribu`.",
          ].join("\n"),
          "RECOMMEND",
        ),
      ],
      recommendation: null,
    };
  }

  // Buat alokasi: max 3 kampanye teratas
  const topCampaigns = trustedCampaigns.slice(0, 3);
  const allocations: AllocationItem[] = [];

  // Distribusi berdasarkan weighted score
  const totalScore = topCampaigns.reduce(
    (sum, c) => sum + (fraudScores[c.id]?.overallScore ?? c.trustScore),
    0,
  );

  for (const campaign of topCampaigns) {
    const score = fraudScores[campaign.id]?.overallScore ?? campaign.trustScore;
    const weight = score / totalScore;
    const amount = Math.round(totalAmount * weight);
    const percentage = Math.round(weight * 100);

    allocations.push({
      campaignId: campaign.id,
      campaignName: campaign.name,
      amount,
      percentage,
      reasoning: `Trust Score ${score}/100 — ${campaign.laz} (${campaign.lazVerified ? "Terverifikasi" : "Belum Terverifikasi"})`,
      trustScore: score,
    });
  }

  // Sesuaikan rounding agar total tepat
  const allocatedTotal = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (allocations.length > 0 && allocatedTotal !== totalAmount) {
    allocations[0].amount += totalAmount - allocatedTotal;
  }

  // Ambil Islamic context
  const category = donorIntent ?? "umum";
  const contextResult = await getIslamicContextTool.invoke({
    category: category as
      | "zakat"
      | "sedekah"
      | "yatim"
      | "bencana"
      | "pendidikan"
      | "pangan"
      | "ramadhan"
      | "umum",
    type: "hadith",
  });
  const contextData = parseJsonWithSchema(
    contextResult,
    islamicContextResultSchema,
  );
  const islamicContext =
    contextData?.success && contextData.quote
      ? `${contextData.quote.reference}: "${contextData.quote.translation}"`
      : "";

  const recommendation: Recommendation = {
    allocations,
    totalAmount,
    reasoning: `Rekomendasi disusun berdasarkan analisis Trust Score, urgensi kebutuhan dana, dan kesesuaian dengan niat ${donorIntent ?? "donasi"} Anda.`,
    islamicContext,
  };

  // Build base message
  const message = buildRecommendationMessage(recommendation, donorIntent);

  // Generate personalized intro via LLM (fallback: empty string)
  let personalizedIntro = "";
  try {
    const campaignNames = allocations.map((a) => a.campaignName).join(", ");
    const personalizationResponse = await invokeWithRetryAndTimeout(
      () =>
        personalizationLlm.invoke([
          new SystemMessage(
            "Anda adalah asisten donasi islami yang hangat dan empatik. Tulis 2-3 kalimat Bahasa Indonesia yang personal dan menyentuh hati untuk menjelaskan mengapa rekomendasi kampanye ini tepat untuk niat donasi pengguna. Jangan sebut angka nominal. Tutup dengan doa singkat.",
          ),
          new HumanMessage(
            `Niat donasi: ${
              donorIntent ?? "sedekah"
            }\nKampanye yang direkomendasikan: ${campaignNames}`,
          ),
        ]),
      {
        timeoutMs: aiRuntime.llmTimeoutMs,
        maxRetries: aiRuntime.llmMaxRetries,
        initialRetryDelayMs: aiRuntime.llmInitialRetryDelayMs,
        operationName: "recommend.personalization_intro",
      },
    );
    personalizedIntro =
      sanitizeModelOutput(String(personalizationResponse.content)) + "\n\n";
  } catch {
    // Fallback: use standard message without personalization
  }

  return {
    messages: [buildAgentMessage(personalizedIntro + message, "RECOMMEND")],
    recommendation,
  };
}

function buildRecommendationMessage(
  rec: Recommendation,
  intent: string | null,
): string {
  const lines: string[] = [`💡 **Rekomendasi Alokasi Donasi**\n`];

  if (rec.totalAmount > 0) {
    lines.push(`Total kewajiban zakat: **${formatRupiah(rec.totalAmount)}**\n`);
  }

  for (let i = 0; i < rec.allocations.length; i++) {
    const alloc = rec.allocations[i];
    const num = i + 1;

    if (rec.totalAmount > 0) {
      lines.push(
        `**${num}. ${alloc.campaignName}**\n   💰 ${formatRupiah(alloc.amount)} (${alloc.percentage}%)\n   📊 ${alloc.reasoning}\n`,
      );
    } else {
      lines.push(
        `**${num}. ${alloc.campaignName}**\n   📊 ${alloc.reasoning}\n`,
      );
    }
  }

  lines.push(`---`);
  lines.push(rec.reasoning);

  if (rec.islamicContext) {
    lines.push(`\n📖 ${rec.islamicContext}`);
  }

  lines.push(
    `\n✅ Apakah Anda ingin **Bayar Sekarang** atau **Ubah Alokasi**?`,
  );

  return lines.join("\n");
}
