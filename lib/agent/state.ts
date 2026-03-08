// ============================================================
// LangGraph Agent — State Schema (SedekahState)
// ============================================================

import { BaseMessage } from "@langchain/core/messages";
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

// ---------- Sub-types ----------

export interface UserFinancialData {
  penghasilan: number | null;
  tabungan: number | null;
  emas: number | null; // gram
  saham: number | null;
  crypto: number | null;
  hutang: number | null;
  jumlahJiwa: number | null; // untuk zakat fitrah
}

export interface ZakatBreakdown {
  zakatPenghasilan: number;
  zakatTabungan: number;
  zakatEmas: number;
  zakatSaham: number;
  zakatCrypto: number;
  zakatFitrah: number;
  totalKewajiban: number;
  memenuhiNisab: boolean;
  detailPerhitungan: string;
}

export interface CampaignData {
  id: string;
  name: string;
  description: string;
  laz: string;
  lazVerified: boolean;
  targetAmount: number;
  collectedAmount: number;
  trustScore: number;
  category: string;
  region: string;
  isActive: boolean;
  fraudFlags: number;
  endsAt: string | null;
}

export interface FraudScore {
  campaignId: string;
  overallScore: number;
  narrativeScore: number;
  financialScore: number;
  temporalScore: number;
  identityScore: number;
  reasoning: string;
  flags: string[];
}

export interface AllocationItem {
  campaignId: string;
  campaignName: string;
  amount: number;
  percentage: number;
  reasoning: string;
  /** Direct trust score — avoids parsing from reasoning string */
  trustScore?: number;
}

export interface Recommendation {
  allocations: AllocationItem[];
  totalAmount: number;
  reasoning: string;
  islamicContext: string;
}

export interface ImpactItem {
  category: string;
  amount: number;
  description: string;
  beneficiaries: number;
}

export interface ImpactReport {
  totalDonated: number;
  impactScore: number;
  items: ImpactItem[];
  reflectionMessage: string;
  ayat: string;
}

// ---------- State Annotation ----------

export const SedekahStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,

  /** Data keuangan user yang diparsing dari chat */
  userFinancialData: Annotation<UserFinancialData | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Breakdown kalkulasi zakat per jenis */
  zakatBreakdown: Annotation<ZakatBreakdown | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Daftar kampanye aktif yang terfilter */
  campaigns: Annotation<CampaignData[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),

  /** Trust Score per kampanye ID */
  fraudScores: Annotation<Record<string, FraudScore>>({
    reducer: (_prev, next) => next,
    default: () => ({}),
  }),

  /** Rekomendasi alokasi optimal + reasoning */
  recommendation: Annotation<Recommendation | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** URL checkout Mayar */
  mayarInvoiceLink: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Status pembayaran */
  paymentStatus: Annotation<"pending" | "paid" | "failed" | "cancelled" | null>(
    {
      reducer: (_prev, next) => next,
      default: () => null,
    },
  ),

  /** Laporan dampak donasi */
  impactReport: Annotation<ImpactReport | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Niat donatur dari chat (zakat/sedekah/bencana/yatim/dll) */
  donorIntent: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Ayat/hadith relevan untuk step saat ini */
  islamicContext: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** ID invoice Mayar setelah dibuat */
  invoiceId: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Nama donatur dari sesi auth (untuk invoice Mayar) */
  donorName: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Email donatur dari sesi auth (untuk invoice Mayar) */
  donorEmail: Annotation<string | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),

  /** Nominal donasi custom (untuk sedekah/infaq tanpa kalkulasi zakat) */
  customAmount: Annotation<number | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
});

/** Inferred type dari SedekahState */
export type SedekahState = typeof SedekahStateAnnotation.State;
