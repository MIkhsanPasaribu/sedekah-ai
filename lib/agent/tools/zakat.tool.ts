// ============================================================
// LangGraph Tool — Kalkulasi Zakat
// ============================================================

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import {
  NISAB_RUPIAH,
  TARIF_ZAKAT,
  HARGA_EMAS_PER_GRAM,
  ZAKAT_FITRAH_PER_JIWA,
  NISAB_EMAS_GRAM,
  formatRupiah,
} from "@/lib/utils";
import type { ZakatBreakdown } from "../state";

const zakatInputSchema = z.object({
  penghasilan: z.number().min(0).describe("Penghasilan per tahun dalam Rupiah"),
  tabungan: z.number().min(0).describe("Total tabungan dalam Rupiah"),
  emas: z.number().min(0).describe("Berat emas yang dimiliki dalam gram"),
  saham: z.number().min(0).describe("Nilai portofolio saham dalam Rupiah"),
  crypto: z.number().min(0).describe("Nilai aset crypto dalam Rupiah"),
  hutang: z.number().min(0).describe("Total hutang dalam Rupiah"),
  jumlahJiwa: z
    .number()
    .min(0)
    .int()
    .describe("Jumlah anggota keluarga untuk zakat fitrah"),
});

/**
 * Tool untuk menghitung semua jenis zakat berdasarkan data keuangan user.
 * Mengikuti aturan nisab 2026: 85g emas ≈ Rp 85.000.000
 */
export const zakatCalculatorTool = tool(
  async (input): Promise<string> => {
    const { penghasilan, tabungan, emas, saham, crypto, hutang, jumlahJiwa } =
      input;

    // Hitung nilai emas dalam Rupiah
    const nilaiEmas = emas * HARGA_EMAS_PER_GRAM;

    // Kurangi hutang secara proporsional dari aset likuid (non-emas)
    const grossLiquid = penghasilan + tabungan + saham + crypto;
    const hutangRatio =
      grossLiquid > 0 ? Math.max(0, grossLiquid - hutang) / grossLiquid : 1;
    const netPenghasilan = Math.round(penghasilan * hutangRatio);
    const netTabungan = Math.round(tabungan * hutangRatio);
    const netSaham = Math.round(saham * hutangRatio);
    const netCrypto = Math.round(crypto * hutangRatio);

    // Total kekayaan bersih (untuk pengecekan nisab keseluruhan)
    const totalHarta =
      netPenghasilan + netTabungan + nilaiEmas + netSaham + netCrypto;
    const memenuhinisab = totalHarta >= NISAB_RUPIAH;

    // Hitung per jenis (menggunakan nominal setelah pengurang hutang)
    const zakatPenghasilan =
      netPenghasilan >= NISAB_RUPIAH ? netPenghasilan * TARIF_ZAKAT : 0;
    const zakatTabungan =
      netTabungan >= NISAB_RUPIAH ? netTabungan * TARIF_ZAKAT : 0;
    const zakatEmas = emas >= NISAB_EMAS_GRAM ? nilaiEmas * TARIF_ZAKAT : 0;
    const zakatSaham = netSaham >= NISAB_RUPIAH ? netSaham * TARIF_ZAKAT : 0;
    const zakatCrypto = netCrypto >= NISAB_RUPIAH ? netCrypto * TARIF_ZAKAT : 0;
    const zakatFitrah = jumlahJiwa * ZAKAT_FITRAH_PER_JIWA;

    const totalKewajiban =
      zakatPenghasilan +
      zakatTabungan +
      zakatEmas +
      zakatSaham +
      zakatCrypto +
      zakatFitrah;

    const breakdown: ZakatBreakdown = {
      zakatPenghasilan,
      zakatTabungan,
      zakatEmas,
      zakatSaham,
      zakatCrypto,
      zakatFitrah,
      totalKewajiban,
      memenuhiNisab: memenuhinisab,
      detailPerhitungan: buildDetailString({
        penghasilan,
        tabungan,
        emas,
        nilaiEmas,
        saham,
        crypto,
        hutang,
        jumlahJiwa,
        zakatPenghasilan,
        zakatTabungan,
        zakatEmas,
        zakatSaham,
        zakatCrypto,
        zakatFitrah,
        totalKewajiban,
        memenuhinisab,
      }),
    };

    return JSON.stringify(breakdown);
  },
  {
    name: "zakat_calculator",
    description:
      "Menghitung semua jenis zakat (penghasilan, tabungan, emas, saham, crypto, fitrah) berdasarkan data keuangan. Menggunakan nisab 2026: 85g emas = Rp 85.000.000. Tarif 2.5%.",
    schema: zakatInputSchema,
  },
);

function buildDetailString(data: {
  penghasilan: number;
  tabungan: number;
  emas: number;
  nilaiEmas: number;
  saham: number;
  crypto: number;
  hutang: number;
  jumlahJiwa: number;
  zakatPenghasilan: number;
  zakatTabungan: number;
  zakatEmas: number;
  zakatSaham: number;
  zakatCrypto: number;
  zakatFitrah: number;
  totalKewajiban: number;
  memenuhinisab: boolean;
}): string {
  const lines: string[] = [
    `📊 Detail Perhitungan Zakat`,
    ``,
    `Nisab 2026: ${NISAB_EMAS_GRAM}g emas × ${formatRupiah(HARGA_EMAS_PER_GRAM)} = ${formatRupiah(NISAB_RUPIAH)}`,
    ``,
  ];

  if (data.penghasilan > 0) {
    lines.push(
      `💰 Zakat Penghasilan: ${formatRupiah(data.penghasilan)} × 2.5% = ${formatRupiah(data.zakatPenghasilan)}${data.zakatPenghasilan === 0 ? " (di bawah nisab)" : ""}`,
    );
  }

  if (data.tabungan > 0) {
    lines.push(
      `🏦 Zakat Tabungan: ${formatRupiah(data.tabungan)} × 2.5% = ${formatRupiah(data.zakatTabungan)}${data.zakatTabungan === 0 ? " (di bawah nisab)" : ""}`,
    );
  }

  if (data.emas > 0) {
    lines.push(
      `✨ Zakat Emas: ${data.emas}g (${formatRupiah(data.nilaiEmas)}) × 2.5% = ${formatRupiah(data.zakatEmas)}${data.zakatEmas === 0 ? " (di bawah 85g)" : ""}`,
    );
  }

  if (data.saham > 0) {
    lines.push(
      `📈 Zakat Saham: ${formatRupiah(data.saham)} × 2.5% = ${formatRupiah(data.zakatSaham)}${data.zakatSaham === 0 ? " (di bawah nisab)" : ""}`,
    );
  }

  if (data.crypto > 0) {
    lines.push(
      `🪙 Zakat Crypto: ${formatRupiah(data.crypto)} × 2.5% = ${formatRupiah(data.zakatCrypto)}${data.zakatCrypto === 0 ? " (di bawah nisab)" : ""}`,
    );
  }

  if (data.jumlahJiwa > 0) {
    lines.push(
      `🍚 Zakat Fitrah: ${data.jumlahJiwa} jiwa × ${formatRupiah(ZAKAT_FITRAH_PER_JIWA)} = ${formatRupiah(data.zakatFitrah)}`,
    );
  }

  lines.push(``);
  lines.push(`✅ Total Kewajiban Zakat: ${formatRupiah(data.totalKewajiban)}`);

  return lines.join("\n");
}
