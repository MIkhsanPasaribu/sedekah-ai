// ============================================================
// LangGraph Node 2: CALCULATE — Zakat Calculation + Islamic Context
// ============================================================
// Hitung semua jenis zakat, attach ayat QS 9:103
// Transplant RUANG HATI: IslamicContextTool

import { SystemMessage } from "@langchain/core/messages";
import { buildAgentMessage } from "@/lib/agent/utils";
import { parseJsonWithSchema } from "@/lib/agent/utils";
import type { SedekahState } from "../state";
import { zakatCalculatorTool } from "../tools/zakat.tool";
import { getIslamicContextTool } from "../tools/islamic-context.tool";
import {
  NISAB_RUPIAH,
  TARIF_ZAKAT,
  HARGA_EMAS_PER_GRAM,
  ZAKAT_FITRAH_PER_JIWA,
  formatRupiah,
} from "@/lib/utils";
import type { ZakatBreakdown } from "../state";
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

const zakatBreakdownSchema = z.object({
  zakatPenghasilan: z.number(),
  zakatTabungan: z.number(),
  zakatEmas: z.number(),
  zakatSaham: z.number(),
  zakatCrypto: z.number(),
  zakatFitrah: z.number(),
  totalKewajiban: z.number(),
  memenuhiNisab: z.boolean(),
  detailPerhitungan: z.string(),
});

export async function calculateNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const { userFinancialData, donorIntent } = state;

  // Jika sedekah/infaq biasa tanpa data keuangan, skip kalkulasi zakat
  if (
    !userFinancialData ||
    (donorIntent &&
      ["sedekah", "infaq", "wakaf", "bencana"].includes(donorIntent))
  ) {
    // Ambil Islamic context saja
    const contextResult = await getIslamicContextTool.invoke({
      category:
        (donorIntent as
          | "sedekah"
          | "yatim"
          | "bencana"
          | "pendidikan"
          | "pangan") ?? "sedekah",
      type: "any",
    });
    const contextData = parseJsonWithSchema(
      contextResult,
      islamicContextResultSchema,
    );

    const islamicContext =
      contextData?.success && contextData.quote
        ? `${contextData.quote.reference}: "${contextData.quote.translation}"`
        : null;

    return {
      messages: [
        buildAgentMessage(
          `Alhamdulillah, niat ${donorIntent ?? "sedekah"} Anda sangat mulia. ${islamicContext ? `\n\n📖 ${islamicContext}` : ""}\n\nMari kita carikan kampanye yang tepat untuk donasi Anda.`,
          "CALCULATE",
        ),
      ],
      islamicContext,
    };
  }

  // Hitung zakat menggunakan tool
  const zakatResult = await zakatCalculatorTool.invoke({
    penghasilan: userFinancialData.penghasilan ?? 0,
    tabungan: userFinancialData.tabungan ?? 0,
    emas: userFinancialData.emas ?? 0,
    saham: userFinancialData.saham ?? 0,
    crypto: userFinancialData.crypto ?? 0,
    hutang: Math.max(0, userFinancialData.hutang ?? 0),
    jumlahJiwa: userFinancialData.jumlahJiwa ?? 0,
  });

  const parsedZakat = parseJsonWithSchema(zakatResult, zakatBreakdownSchema);
  const zakatBreakdown: ZakatBreakdown = parsedZakat ?? {
    zakatPenghasilan: 0,
    zakatTabungan: 0,
    zakatEmas: 0,
    zakatSaham: 0,
    zakatCrypto: 0,
    zakatFitrah: 0,
    totalKewajiban: 0,
    memenuhiNisab: false,
    detailPerhitungan: "Perhitungan belum tersedia.",
  };

  // Ambil Islamic context: QS 9:103 untuk zakat
  const contextResult = await getIslamicContextTool.invoke({
    category: "zakat",
    type: "ayat",
  });
  const contextData = parseJsonWithSchema(
    contextResult,
    islamicContextResultSchema,
  );

  const islamicContext =
    contextData?.success && contextData.quote
      ? `${contextData.quote.reference}: "${contextData.quote.translation}"`
      : 'QS At-Taubah (9:103): "Ambillah zakat dari sebagian harta mereka, dengan zakat itu kamu membersihkan dan menyucikan mereka."';

  // Format pesan untuk user
  const message = buildCalculationMessage(zakatBreakdown, islamicContext);

  return {
    messages: [buildAgentMessage(message, "CALCULATE")],
    zakatBreakdown,
    islamicContext,
  };
}

function buildCalculationMessage(
  breakdown: ZakatBreakdown,
  islamicContext: string,
): string {
  const lines: string[] = [`🧮 **Hasil Perhitungan Zakat Anda**\n`];

  if (breakdown.zakatPenghasilan > 0) {
    lines.push(
      `💰 Zakat Penghasilan: **${formatRupiah(breakdown.zakatPenghasilan)}**`,
    );
  }
  if (breakdown.zakatTabungan > 0) {
    lines.push(
      `🏦 Zakat Tabungan: **${formatRupiah(breakdown.zakatTabungan)}**`,
    );
  }
  if (breakdown.zakatEmas > 0) {
    lines.push(`✨ Zakat Emas: **${formatRupiah(breakdown.zakatEmas)}**`);
  }
  if (breakdown.zakatSaham > 0) {
    lines.push(`📈 Zakat Saham: **${formatRupiah(breakdown.zakatSaham)}**`);
  }
  if (breakdown.zakatCrypto > 0) {
    lines.push(`🪙 Zakat Crypto: **${formatRupiah(breakdown.zakatCrypto)}**`);
  }
  if (breakdown.zakatFitrah > 0) {
    lines.push(`🍚 Zakat Fitrah: **${formatRupiah(breakdown.zakatFitrah)}**`);
  }

  lines.push(``);
  lines.push(
    `✅ **Total Kewajiban Zakat: ${formatRupiah(breakdown.totalKewajiban)}**`,
  );
  lines.push(``);
  lines.push(`📖 ${islamicContext}`);
  lines.push(``);
  lines.push(
    `Sekarang saya akan carikan kampanye terbaik untuk menyalurkan zakat Anda... ✨`,
  );

  return lines.join("\n");
}
