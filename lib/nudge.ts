// ============================================================
// AI-Powered Daily Nudge Generator
// ============================================================
// Generates personalized Ramadhan nudge using Groq.
// Caches per user per Ramadhan day in GivingJourney.nudgeMessage.

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { prisma } from "@/lib/prisma";
import { getDailyNudge } from "@/lib/utils";
import { sanitizeCardNarrativeOutput } from "@/lib/agent/utils";
import { createTaskLlm } from "@/lib/models/factory";

const nudgeLlm = createTaskLlm("dashboard_daily_nudge", {
  temperature: 0.7,
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
    const cachedClean = sanitizeCardNarrativeOutput(
      existingJourney.nudgeMessage,
    );
    if (!cachedClean) {
      const fallback = getDailyNudge(ramadhanDay, donatedToday);
      if (fallback) {
        await prisma.givingJourney.upsert({
          where: { userId_ramadhanDay: { userId, ramadhanDay } },
          update: { nudgeMessage: fallback },
          create: { userId, ramadhanDay, nudgeMessage: fallback },
        });
      }
      return fallback;
    }

    if (cachedClean !== existingJourney.nudgeMessage) {
      await prisma.givingJourney.upsert({
        where: { userId_ramadhanDay: { userId, ramadhanDay } },
        update: { nudgeMessage: cachedClean },
        create: { userId, ramadhanDay, nudgeMessage: cachedClean },
      });
    }

    return cachedClean;
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
        "Anda adalah asisten donasi islami yang hangat dan personal. Tulis satu paragraf singkat (2-3 kalimat) dalam Bahasa Indonesia sebagai nudge motivasional harian untuk pengguna di bulan Ramadhan. Sesuaikan dengan fase Ramadhan, status donasi hari ini, dan streak. Sertakan satu kutipan Al-Quran atau hadits yang relevan. Akhiri dengan doa pendek. Jangan gunakan bahasa teknis. Jangan tampilkan markdown (**, #, bullet), jangan tampilkan <think>, dan jangan tampilkan catatan internal.",
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

    const nudgeMessage = sanitizeCardNarrativeOutput(String(response.content));
    const safeNudgeMessage =
      nudgeMessage || getDailyNudge(ramadhanDay, donatedToday);

    if (!safeNudgeMessage) {
      return null;
    }

    // Cache result — upsert for safety in case of race condition
    await prisma.givingJourney.upsert({
      where: { userId_ramadhanDay: { userId, ramadhanDay } },
      update: { nudgeMessage: safeNudgeMessage },
      create: { userId, ramadhanDay, nudgeMessage: safeNudgeMessage },
    });

    return safeNudgeMessage;
  } catch {
    // Graceful fallback to static nudge
    return getDailyNudge(ramadhanDay, donatedToday);
  }
}
