// ============================================================
// LangGraph Node 7: IMPACT TRACKER — Post-Payment Monitoring
// ============================================================
// Post-payment monitoring + spiritual reflection
// Transplant RUANG HATI: MuhasabahTrigger

import { AIMessage } from "@langchain/core/messages";
import type { SedekahState, ImpactReport, ImpactItem } from "../state";
import { getIslamicContextTool } from "../tools/islamic-context.tool";
import { formatRupiah } from "@/lib/utils";

export async function impactTrackerNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const { recommendation, paymentStatus, donorIntent } = state;

  if (!recommendation) {
    return {
      messages: [
        new AIMessage({
          content: "Menunggu konfirmasi pembayaran...",
          name: "IMPACT_TRACKER",
        }),
      ],
    };
  }

  const isPaid = paymentStatus === "paid";

  // Generate impact report berdasarkan alokasi (projected atau confirmed)
  const items: ImpactItem[] = recommendation.allocations.map((alloc) => {
    const beneficiaries = estimateBeneficiaries(
      alloc.amount,
      alloc.campaignName,
    );

    return {
      category: alloc.campaignName,
      amount: alloc.amount,
      description: generateImpactDescription(alloc.amount, alloc.campaignName),
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
  const contextData = JSON.parse(contextResult);

  const ayat = contextData.success
    ? `${contextData.quote.reference}: "${contextData.quote.translation}"`
    : 'QS Ibrahim (14:7): "Sesungguhnya jika kamu bersyukur, pasti Kami akan menambah (nikmat) kepadamu."';

  const reflectionMessage = buildReflectionMessage(donorIntent);

  const impactReport: ImpactReport = {
    totalDonated,
    impactScore,
    items,
    reflectionMessage,
    ayat,
  };

  const message = isPaid
    ? buildImpactMessage(impactReport)
    : buildProjectedImpactMessage(impactReport);

  return {
    messages: [new AIMessage({ content: message, name: "IMPACT_TRACKER" })],
    impactReport,
  };
}

function estimateBeneficiaries(amount: number, campaignName: string): number {
  // Simplified estimation — in production, use real data from LAZ reports
  const lower = campaignName.toLowerCase();
  if (lower.includes("yatim")) return Math.max(1, Math.round(amount / 500_000));
  if (lower.includes("pangan") || lower.includes("sembako"))
    return Math.max(1, Math.round(amount / 100_000));
  if (lower.includes("kesehatan"))
    return Math.max(1, Math.round(amount / 1_000_000));
  if (lower.includes("pendidikan"))
    return Math.max(1, Math.round(amount / 300_000));
  if (lower.includes("bencana"))
    return Math.max(1, Math.round(amount / 200_000));
  return Math.max(1, Math.round(amount / 250_000));
}

function generateImpactDescription(
  amount: number,
  campaignName: string,
): string {
  const beneficiaries = estimateBeneficiaries(amount, campaignName);
  const lower = campaignName.toLowerCase();

  if (lower.includes("yatim")) {
    return `Mendukung ${beneficiaries} anak yatim selama 1 bulan`;
  }
  if (lower.includes("pangan") || lower.includes("sembako")) {
    return `${beneficiaries} paket sembako untuk keluarga dhuafa`;
  }
  if (lower.includes("kesehatan")) {
    return `Bantuan medis untuk ${beneficiaries} pasien`;
  }
  if (lower.includes("pendidikan")) {
    return `Beasiswa untuk ${beneficiaries} siswa selama 1 semester`;
  }
  if (lower.includes("bencana")) {
    return `Bantuan darurat untuk ${beneficiaries} keluarga terdampak`;
  }
  return `Membantu ${beneficiaries} penerima manfaat`;
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

function buildReflectionMessage(intent: string | null): string {
  const messages: Record<string, string> = {
    zakat_mal:
      "Alhamdulillah, zakat Anda telah membersihkan harta dan menyucikan jiwa. Semoga menjadi perisai dari api neraka.",
    zakat_fitrah:
      "Alhamdulillah, zakat fitrah Anda melengkapi ibadah puasa Ramadhan. Semoga menjadi pembersih jiwa menjelang Idul Fitri.",
    sedekah:
      "Alhamdulillah, sedekah Anda tidak akan mengurangi harta, melainkan menambahnya. Semoga Allah melipatgandakan kebaikan Anda.",
    infaq:
      "Alhamdulillah, infaq Anda menjadi cahaya di dunia dan di akhirat. Semoga Allah membalas dengan yang lebih baik.",
    wakaf:
      "Alhamdulillah, wakaf Anda menjadi amal jariyah yang pahalanya tidak terputus. Semoga mengalir terus meski Anda telah tiada.",
    bencana:
      "Alhamdulillah, bantuan Anda menjadi secercah harapan bagi saudara kita yang terdampak. Semoga Allah meringankan beban mereka.",
  };

  return (
    messages[intent ?? "sedekah"] ??
    "Alhamdulillah, donasi Anda telah tersalurkan. Semoga Allah melipatgandakan kebaikan Anda. 🤲"
  );
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

function buildProjectedImpactMessage(report: ImpactReport): string {
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
  lines.push(
    `\n_Silakan selesaikan pembayaran melalui link yang telah diberikan. Kami akan mengonfirmasi setelah pembayaran diterima._ 🤲`,
  );

  return lines.join("\n");
}
