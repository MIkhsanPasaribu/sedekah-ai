// ============================================================
// Shared Schema — Fraud Detection Schemas
// ============================================================
// Digunakan oleh: fraud.tool.ts, fraud.ts (node)

import { z } from "zod";

/** Schema for LLM-based narrative manipulation analysis */
export const narrativeAnalysisSchema = z.object({
  manipulationScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Skor manipulasi 0-100: 0=tidak ada manipulasi (terpercaya), 100=sangat manipulatif",
    ),
  detectedTechniques: z
    .array(z.string())
    .describe("Teknik manipulasi yang terdeteksi"),
  explanation: z.string().describe("Penjelasan singkat analisis narasi"),
});

/** Schema for the full fraud tool result */
export const fraudToolResultSchema = z.object({
  success: z.boolean(),
  fraudScores: z.record(
    z.string(),
    z.object({
      campaignId: z.string(),
      overallScore: z.number(),
      narrativeScore: z.number(),
      financialScore: z.number(),
      temporalScore: z.number(),
      identityScore: z.number(),
      reasoning: z.string(),
      flags: z.array(z.string()),
    }),
  ),
});
