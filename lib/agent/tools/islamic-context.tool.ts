// ============================================================
// LangGraph Tool — Islamic Context (Ayat & Hadith)
// ============================================================
// NOTE: Quotes database has been moved to @/lib/islamic-quotes
// This file now imports from that module and wraps it as a LangGraph tool.

import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ISLAMIC_QUOTES } from "@/lib/islamic-quotes";

export { ISLAMIC_QUOTES };

const getIslamicContextSchema = z.object({
  category: z
    .enum([
      "zakat",
      "sedekah",
      "yatim",
      "bencana",
      "pendidikan",
      "pangan",
      "kesehatan",
      "ramadhan",
      "umum",
    ])
    .describe("Kategori konteks yang diinginkan"),
  type: z
    .enum(["ayat", "hadith", "doa", "any"])
    .optional()
    .describe("Jenis referensi (default: any)"),
});

/**
 * Tool untuk mendapatkan ayat Al-Quran, hadith, atau doa yang relevan
 * berdasarkan konteks donasi user.
 * Digunakan di Node 2 (CALCULATE), Node 5 (RECOMMEND), dan Node 7 (IMPACT).
 */
export const getIslamicContextTool = tool(
  async (input): Promise<string> => {
    let filtered = ISLAMIC_QUOTES.filter((q) => q.category === input.category);

    // Fallback ke umum jika kategori tidak ditemukan
    if (filtered.length === 0) {
      filtered = ISLAMIC_QUOTES.filter((q) => q.category === "umum");
    }

    // Filter by type jika specified
    if (input.type && input.type !== "any") {
      const typed = filtered.filter((q) => q.type === input.type);
      if (typed.length > 0) filtered = typed;
    }

    // Pilih random
    const selected = filtered[Math.floor(Math.random() * filtered.length)];

    if (!selected) {
      return JSON.stringify({
        success: false,
        error: "Tidak ditemukan referensi untuk konteks ini",
      });
    }

    return JSON.stringify({
      success: true,
      quote: {
        type: selected.type,
        reference: selected.reference,
        arabic: selected.arabic || null,
        translation: selected.translation,
        category: selected.category,
      },
    });
  },
  {
    name: "get_islamic_context",
    description:
      "Mendapatkan ayat Al-Quran, hadith, atau doa yang relevan berdasarkan kategori donasi. Digunakan untuk memberikan konteks spiritual di setiap tahap proses donasi.",
    schema: getIslamicContextSchema,
  },
);
