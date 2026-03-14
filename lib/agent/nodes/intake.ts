// ============================================================
// LangGraph Node 1: INTAKE — Empathy-First Intake
// ============================================================
// Salam + validasi emosional + tangkap niat & data keuangan dari chat
// Transplant RUANG HATI: EmpathyEngineNode
//
// Two-call pattern:
//   Call 1 — conversational (temp 0.7): generate warm empathetic response for user
//   Call 2 — structured output (temp 0): reliably extract financial data as JSON

import { ChatGroq } from "@langchain/groq";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { buildAgentMessage } from "@/lib/agent/utils";
import { z } from "zod";
import type { SedekahState } from "../state";

// ── LLM instances ────────────────────────────────────────────
const conversationalLlm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});

const intakeExtractionSchema = z.object({
  donorIntent: z
    .enum(["zakat_mal", "zakat_fitrah", "sedekah", "infaq", "wakaf", "bencana"])
    .nullable()
    .describe(
      "Niat donasi yang terdeteksi dari percakapan, null jika belum jelas",
    ),
  customAmount: z
    .number()
    .nullable()
    .describe(
      "Nominal donasi eksplisit dalam Rupiah (misal 100000 untuk Rp 100k), null jika tidak disebutkan",
    ),
  penghasilan: z
    .number()
    .nullable()
    .describe("Penghasilan per tahun dalam Rupiah, null jika tidak disebutkan"),
  tabungan: z
    .number()
    .nullable()
    .describe("Total tabungan dalam Rupiah, null jika tidak disebutkan"),
  emas: z
    .number()
    .nullable()
    .describe(
      "Berat emas dalam gram (bukan Rupiah), null jika tidak disebutkan",
    ),
  saham: z
    .number()
    .nullable()
    .describe(
      "Nilai portofolio saham/investasi dalam Rupiah, null jika tidak disebutkan",
    ),
  crypto: z
    .number()
    .nullable()
    .describe("Nilai aset crypto dalam Rupiah, null jika tidak disebutkan"),
  hutang: z
    .number()
    .nullable()
    .describe("Total hutang dalam Rupiah, null jika tidak disebutkan"),
  jumlahJiwa: z
    .number()
    .int()
    .nullable()
    .describe(
      "Jumlah anggota keluarga untuk zakat fitrah, null jika tidak disebutkan",
    ),
  dataComplete: z
    .boolean()
    .describe(
      "True hanya jika user sudah memberikan cukup data keuangan untuk menghitung zakat. False jika data masih kurang atau user hanya menyebutkan niat sedekah/infaq tanpa data keuangan.",
    ),
});

const extractionLlm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  apiKey: process.env.GROQ_API_KEY,
}).withStructuredOutput(intakeExtractionSchema);

// ── System Prompts ────────────────────────────────────────────
const CONVERSATIONAL_SYSTEM_PROMPT = `Kamu adalah Amil AI SEDEKAH.AI — asisten digital terpercaya untuk zakat dan sedekah.

TUGAS:
1. Sambut user dengan "Assalamu'alaikum" jika ini pesan pertama
2. Validasi emosional — "Alhamdulillah, niat baik Anda..."
3. Tangkap niat donasi: zakat_mal, zakat_fitrah, sedekah, infaq, wakaf, atau bantuan bencana
4. Tanyakan data keuangan yang dibutuhkan untuk kalkulasi zakat (jika relevan):
   - Penghasilan per tahun
   - Total tabungan
   - Emas (gram)
   - Saham/investasi
   - Crypto
   - Hutang
   - Jumlah jiwa (untuk zakat fitrah)

GAYA BAHASA:
- 100% Bahasa Indonesia
- Hangat, empatis, penuh hikmah
- JANGAN gunakan istilah teknis (JSON, API, error)
- Gunakan emoji yang sopan: ✨🤲💚🕌

PENTING:
- Jika user sudah menyebutkan data keuangan, langsung proses
- Jika user hanya menyebutkan niat sedekah (tanpa zakat), tidak perlu data keuangan detail
- Jika user menyebutkan nominal donasi (misal "100 ribu", "Rp 500.000", "1 juta"), konfirmasi nominalnya
- Selalu akhiri dengan pertanyaan lanjutan jika data belum lengkap

Berikan respons natural dalam Bahasa Indonesia. Jangan tampilkan JSON atau data teknis apapun kepada user.`;

const EXTRACTION_SYSTEM_PROMPT = `Kamu adalah sistem ekstraksi data. Analisis percakapan dan ekstrak data terstruktur berikut:

1. Niat donasi (donorIntent): zakat_mal, zakat_fitrah, sedekah, infaq, wakaf, atau bencana
2. Nominal donasi eksplisit (customAmount) dalam Rupiah penuh
3. Data keuangan zakat:
   - penghasilan (per tahun, dalam Rupiah)
   - tabungan (total, dalam Rupiah)
   - emas (berat dalam GRAM, BUKAN Rupiah)
   - saham (nilai dalam Rupiah)
   - crypto (nilai dalam Rupiah)
   - hutang (total dalam Rupiah)
   - jumlahJiwa (untuk zakat fitrah, angka bulat)
4. dataComplete: true HANYA jika user sudah berikan cukup data untuk menghitung zakat

Konversikan semua nominal ke angka penuh (misal "1 juta" = 1000000, "500 ribu" = 500000).
Gunakan null jika nilai tidak disebutkan.
Sedekah/infaq/wakaf/bencana tidak memerlukan data keuangan — set dataComplete=true jika niatnya jelas.`;

// ── Node ────────────────────────────────────────────────────
export async function intakeNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const messages = state.messages;

  // Build messages list for extraction — use only the conversation content
  const extractionMessages = [
    new SystemMessage(EXTRACTION_SYSTEM_PROMPT),
    ...messages.map((m) => {
      const content = typeof m.content === "string" ? m.content : "";
      const msgType = (m as { _getType?: () => string })._getType?.();
      return msgType === "ai"
        ? new AIMessage(content)
        : new HumanMessage(content);
    }),
  ];

  // Run both LLM calls in parallel for efficiency
  const [conversationalResponse, extracted] = await Promise.all([
    conversationalLlm.invoke([
      new SystemMessage(CONVERSATIONAL_SYSTEM_PROMPT),
      ...messages,
    ]),
    extractionLlm.invoke(extractionMessages).catch(() => null),
  ]);

  const cleanContent =
    typeof conversationalResponse.content === "string"
      ? conversationalResponse.content.trim()
      : "";

  // Merge extracted data onto existing state (prefer new values when non-null)
  let donorIntent = state.donorIntent;
  let userFinancialData = state.userFinancialData;
  let customAmount = state.customAmount;

  if (extracted) {
    if (extracted.donorIntent) donorIntent = extracted.donorIntent;
    if (extracted.customAmount && extracted.customAmount > 0)
      customAmount = extracted.customAmount;

    if (extracted.dataComplete) {
      userFinancialData = {
        penghasilan: extracted.penghasilan ?? 0,
        tabungan: extracted.tabungan ?? 0,
        emas: extracted.emas ?? 0,
        saham: extracted.saham ?? 0,
        crypto: extracted.crypto ?? 0,
        hutang: extracted.hutang ?? 0,
        jumlahJiwa: extracted.jumlahJiwa ?? 0,
      };
    }
  }

  return {
    messages: [buildAgentMessage(cleanContent, "INTAKE")],
    donorIntent,
    userFinancialData,
    customAmount,
  };
}
