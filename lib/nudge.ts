// ============================================================
// AI-Powered Daily Nudge Generator
// ============================================================
// Generates personalized Ramadhan nudge using Groq.
// Caches per user per Ramadhan day in GivingJourney.nudgeMessage.

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { getDailyNudge } from "@/lib/utils";

const nudgeLlm = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7,
  apiKey: process.env.GROQ_API_KEY,
});

/**
 * Generate a personalized AI nudge for the user's current Ramadhan day.
 * Results are cached in GivingJourney.nudgeMessage (one per userId + ramadhanDay).
 * Falls back to static getDailyNudge() if Groq fails.
 */
export async function generateAiNudge(
  userId: string,
  ramadhanDay: number,
  donatedToday: boolean,
  streak: number,
  lastCategory: string | null,
): Promise<string | null> {
  if (ramadhanDay <= 0) return null;

  // Return cached nudge if this day's record already has one
  const existingJourney = await prisma.givingJourney.findUnique({
    where: { userId_ramadhanDay: { userId, ramadhanDay } },
    select: { nudgeMessage: true },
  });

  if (existingJourney?.nudgeMessage) {
    return existingJourney.nudgeMessage;
  }

  // Generate new nudge via Groq
  try {
    const phase =
      ramadhanDay <= 10
        ? "Rahmat (10 malam pertama)"
        : ramadhanDay <= 20
          ? "Maghfirah (10 malam kedua)"
          : "Itqun min an-nar (10 malam terakhir)";

    const response = await nudgeLlm.invoke([
      new SystemMessage(
        "Anda adalah asisten donasi islami yang hangat dan personal. Tulis satu paragraf singkat (2-3 kalimat) dalam Bahasa Indonesia sebagai nudge motivasional harian untuk pengguna di bulan Ramadhan. Sesuaikan dengan fase Ramadhan, status donasi hari ini, dan streak. Sertakan satu kutipan Al-Quran atau hadits yang relevan. Akhiri dengan doa pendek. Jangan gunakan bahasa teknis.",
      ),
      new HumanMessage(
        `Hari Ramadhan ke-${ramadhanDay} (${phase}). ${
          donatedToday
            ? "Pengguna sudah berdonasi hari ini — beri apresiasi dan doa."
            : "Pengguna belum berdonasi hari ini — motivasi dengan lembut."
        } Streak saat ini: ${streak} hari.${
          lastCategory ? ` Kategori donasi terakhir: ${lastCategory}.` : ""
        }`,
      ),
    ]);

    const nudgeMessage = String(response.content);

    // Cache result — upsert for safety in case of race condition
    await prisma.givingJourney.upsert({
      where: { userId_ramadhanDay: { userId, ramadhanDay } },
      update: { nudgeMessage },
      create: { userId, ramadhanDay, nudgeMessage },
    });

    return nudgeMessage;
  } catch {
    // Graceful fallback to static nudge
    return getDailyNudge(ramadhanDay, donatedToday);
  }
}
