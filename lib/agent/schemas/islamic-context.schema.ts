// ============================================================
// Shared Schema — Islamic Context Tool Result
// ============================================================
// Digunakan oleh: calculate.ts, recommend.ts, impact.ts

import { z } from "zod";

export const islamicContextResultSchema = z.object({
  success: z.boolean(),
  quote: z
    .object({
      reference: z.string(),
      translation: z.string(),
    })
    .optional(),
});
