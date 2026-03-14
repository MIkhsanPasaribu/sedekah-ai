// ============================================================
// LangGraph Node 7: IMPACT TRACKER — Post-Payment Monitoring
// ============================================================
// Post-payment monitoring + spiritual reflection
// Transplant RUANG HATI: MuhasabahTrigger

import { buildAgentMessage } from "@/lib/agent/utils";
import { parseJsonWithSchema } from "@/lib/agent/utils";
import type { SedekahState, ImpactReport, ImpactItem } from "../state";
import { getIslamicContextTool } from "../tools/islamic-context.tool";
import {
  estimateBeneficiaries,
  formatRupiah,
  resolveImpactCategory,
} from "@/lib/utils";
import { getDonationReflection } from "@/lib/islamic-quotes";
import { z } from "zod";

const islamicContextResultSchema = z.object({
  success: z.boolean(),
  quote: z
    .object({
      reference: z.string(),
      translation: z.string(),
    })
    .optional(),
});

export async function impactTrackerNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const { recommendation, paymentStatus, donorIntent, mayarInvoiceLink } =
    state;

  if (!recommendation) {
    return {
      messages: [
        buildAgentMessage(
          "Menunggu konfirmasi pembayaran...",
          "IMPACT_TRACKER",
        ),
      ],
    };
  }

  const isPaid = paymentStatus === "paid";

  // Build category lookup from state campaigns
  const campaignCategoryMap = new Map(
    (state.campaigns ?? []).map((c) => [
      c.id,
      resolveImpactCategory(c.category),
    ]),
  );

  // Generate impact report berdasarkan alokasi (projected atau confirmed)
  const items: ImpactItem[] = recommendation.allocations.map((alloc) => {
    const category = resolveImpactCategory(
      campaignCategoryMap.get(alloc.campaignId),
    );
    const beneficiaries = estimateBeneficiaries(alloc.amount, category);

    return {
      category: alloc.campaignName,
      amount: alloc.amount,
      description: generateImpactDescription(category, beneficiaries),
      beneficiaries,
    };
  });

  const totalDonated = recommendation.totalAmount;
  const impactScore = calculateImpactScore(items);

  // Ambil ayat/doa untuk reflection
  const contextResult = await getIslamicContextTool.invoke({
    category: "umum",
    type: "doa",
  });
  const contextData = parseJsonWithSchema(
    contextResult,
    islamicContextResultSchema,
  );

  const ayat =
    contextData?.success && contextData.quote
      ? `${contextData.quote.reference}: "${contextData.quote.translation}"`
      : 'QS Ibrahim (14:7): "Sesungguhnya jika kamu bersyukur, pasti Kami akan menambah (nikmat) kepadamu."';

  const reflectionMessage = getDonationReflection(donorIntent);

  const impactReport: ImpactReport = {
    totalDonated,
    impactScore,
    items,
    reflectionMessage,
    ayat,
  };

  const message = isPaid
    ? buildImpactMessage(impactReport)
    : buildProjectedImpactMessage(impactReport, mayarInvoiceLink);

  return {
    messages: [buildAgentMessage(message, "IMPACT_TRACKER")],
    impactReport,
  };
}

function generateImpactDescription(
  category: string,
  beneficiaries: number,
): string {
  switch (category.toLowerCase()) {
    case "yatim":
      return `Mendukung ${beneficiaries} anak yatim selama 1 bulan`;
    case "pangan":
      return `${beneficiaries} paket sembako untuk keluarga dhuafa`;
    case "kesehatan":
      return `Bantuan medis untuk ${beneficiaries} pasien`;
    case "pendidikan":
      return `Beasiswa untuk ${beneficiaries} siswa selama 1 semester`;
    case "bencana":
      return `Bantuan darurat untuk ${beneficiaries} keluarga terdampak`;
    default:
      return `Membantu ${beneficiaries} penerima manfaat`;
  }
}

function calculateImpactScore(items: ImpactItem[]): number {
  // Simple impact score: based on diversity and total beneficiaries
  const categories = new Set(items.map((i) => i.category));
  const totalBeneficiaries = items.reduce((sum, i) => sum + i.beneficiaries, 0);

  const diversityBonus = Math.min(20, categories.size * 10);
  const beneficiaryScore = Math.min(60, totalBeneficiaries * 3);
  const baseScore = 30;

  return Math.min(100, baseScore + diversityBonus + beneficiaryScore);
}

function buildImpactMessage(report: ImpactReport): string {
  const lines: string[] = [
    `🎉 **Alhamdulillah! Pembayaran Berhasil!**\n`,
    `📊 **Laporan Dampak Donasi Anda**\n`,
    `💰 Total donasi: **${formatRupiah(report.totalDonated)}**`,
    `⭐ Impact Score: **${report.impactScore}/100**\n`,
  ];

  for (const item of report.items) {
    lines.push(
      `📦 **${item.category}**: ${formatRupiah(item.amount)}\n   → ${item.description}\n`,
    );
  }

  lines.push(`---`);
  lines.push(`\n🤲 ${report.reflectionMessage}`);
  lines.push(`\n📖 ${report.ayat}`);
  lines.push(
    `\n_Semoga Allah melipatgandakan kebaikan Anda. Jazakallahu khairan._ ✨`,
  );

  return lines.join("\n");
}

function buildProjectedImpactMessage(
  report: ImpactReport,
  paymentLink: string | null,
): string {
  const lines: string[] = [
    `✨ **Insya Allah, Inilah Dampak Donasi Anda**\n`,
    `_Setelah pembayaran dikonfirmasi, donasi Anda akan memberikan dampak berikut:_\n`,
    `💰 Total donasi: **${formatRupiah(report.totalDonated)}**`,
    `⭐ Proyeksi Impact Score: **${report.impactScore}/100**\n`,
  ];

  for (const item of report.items) {
    lines.push(
      `📦 **${item.category}**: ${formatRupiah(item.amount)}\n   → ${item.description}\n`,
    );
  }

  lines.push(`---`);
  lines.push(`\n🤲 ${report.reflectionMessage}`);
  lines.push(`\n📖 ${report.ayat}`);
  if (paymentLink) {
    lines.push(`\n🔗 **Link Pembayaran:** [Bayar Sekarang](${paymentLink})`);
    lines.push(`\nJika tombol tidak terbuka, salin URL ini: ${paymentLink}`);
  }
  lines.push(
    `\n_Silakan selesaikan pembayaran melalui link yang telah diberikan. Kami akan mengonfirmasi setelah pembayaran diterima._ 🤲`,
  );

  return lines.join("\n");
}
