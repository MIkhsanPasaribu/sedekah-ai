// ============================================================
// LangGraph Node 1: INTAKE — Empathy-First Intake
// ============================================================
// Salam + validasi emosional + tangkap niat & data keuangan dari chat
// Transplant RUANG HATI: EmpathyEngineNode

import { ChatGroq } from "@langchain/groq";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import type { SedekahState } from "../state";

const llm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});

const INTAKE_SYSTEM_PROMPT = `Kamu adalah Amil AI SEDEKAH.AI — asisten digital terpercaya untuk zakat dan sedekah.

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
- Jika user sudah menyebutkan data keuangan, langsung parsing
- Jika user hanya menyebutkan niat sedekah (tanpa zakat), tidak perlu data keuangan detail
- Jika user menyebutkan nominal donasi (misal "100 ribu", "Rp 500.000", "1 juta"), parsing sebagai customAmount
- Selalu akhiri dengan pertanyaan lanjutan jika data belum lengkap

OUTPUT FORMAT:
Berikan respons natural dalam Bahasa Indonesia.
Di akhir respons, tambahkan blok JSON tersembunyi (tidak ditampilkan ke user) dengan format:
---PARSED_DATA---
{
  "donorIntent": "zakat_mal|zakat_fitrah|sedekah|infaq|wakaf|bencana|null",
  "customAmount": number|null,
  "financialData": {
    "penghasilan": number|null,
    "tabungan": number|null,
    "emas": number|null,
    "saham": number|null,
    "crypto": number|null,
    "hutang": number|null,
    "jumlahJiwa": number|null
  },
  "dataComplete": boolean
}
---END_PARSED_DATA---`;

export async function intakeNode(
  state: SedekahState,
): Promise<Partial<SedekahState>> {
  const messages = state.messages;

  const response = await llm.invoke([
    new SystemMessage(INTAKE_SYSTEM_PROMPT),
    ...messages,
  ]);

  const content = typeof response.content === "string" ? response.content : "";

  // Parse structured data dari respons
  let donorIntent = state.donorIntent;
  let userFinancialData = state.userFinancialData;
  let customAmount = state.customAmount;

  const parsedMatch = content.match(
    /---PARSED_DATA---([\s\S]*?)---END_PARSED_DATA---/,
  );
  if (parsedMatch) {
    try {
      const parsed = JSON.parse(parsedMatch[1].trim());
      if (parsed.donorIntent) {
        donorIntent = parsed.donorIntent;
      }
      if (parsed.customAmount && parsed.customAmount > 0) {
        customAmount = parsed.customAmount;
      }
      if (parsed.financialData && parsed.dataComplete) {
        userFinancialData = {
          penghasilan: parsed.financialData.penghasilan ?? 0,
          tabungan: parsed.financialData.tabungan ?? 0,
          emas: parsed.financialData.emas ?? 0,
          saham: parsed.financialData.saham ?? 0,
          crypto: parsed.financialData.crypto ?? 0,
          hutang: parsed.financialData.hutang ?? 0,
          jumlahJiwa: parsed.financialData.jumlahJiwa ?? 0,
        };
      }
    } catch {
      // Parsing failed, continue without structured data
    }
  }

  // Hapus blok parsed data dari content yang ditampilkan ke user
  const cleanContent = content
    .replace(/---PARSED_DATA---[\s\S]*?---END_PARSED_DATA---/, "")
    .trim();

  return {
    messages: [new AIMessage({ content: cleanContent, name: "INTAKE" })],
    donorIntent,
    userFinancialData,
    customAmount,
  };
}
