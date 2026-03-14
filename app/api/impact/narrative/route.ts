// ============================================================
// API Route — Impact Narrative: AI-generated donation story
// ============================================================
// POST — Generate personalized narrative from donation data

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChatGroq } from "@langchain/groq";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import {
  invokeWithRetryAndTimeout,
  sanitizeCardNarrativeOutput,
} from "@/lib/agent/utils";
import { getAiRuntimeConfig } from "@/lib/env";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { donationId } = body;

  if (!donationId || typeof donationId !== "string") {
    return NextResponse.json(
      { error: "donationId diperlukan" },
      { status: 400 },
    );
  }

  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: {
      campaign: { select: { name: true, category: true, laz: true } },
      user: { select: { authId: true, name: true } },
    },
  });

  if (!donation || donation.user?.authId !== user.id) {
    return NextResponse.json(
      { error: "Donasi tidak ditemukan" },
      { status: 404 },
    );
  }

  const llm = new ChatGroq({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0.7,
    apiKey: process.env.GROQ_API_KEY,
  });
  const aiRuntime = getAiRuntimeConfig();

  const donorName = donation.user?.name ?? "Donatur";
  const campaignName = donation.campaign?.name ?? "Donasi Umum";
  const category = donation.campaign?.category ?? "";
  const amount = formatRupiah(donation.amount);
  const typeLabel = donation.type.replace(/_/g, " ");

  const fallbackNarrative = [
    `Alhamdulillah, niat baik ${donorName} untuk berbagi melalui ${campaignName} menjadi wasilah kebaikan yang nyata.`,
    `Donasi sebesar ${amount} untuk program ${typeLabel.toLowerCase()} membuka jalan bantuan yang lebih cepat bagi penerima manfaat di kategori ${category || "sosial"}.`,
    "Setiap amanah yang dititipkan membantu tim lapangan menyalurkan bantuan secara tepat sasaran, terukur, dan penuh tanggung jawab.",
    "Semoga Allah menerima amal ini, melipatgandakan pahalanya, dan menghadirkan keberkahan berkelanjutan bagi semua pihak.",
  ].join("\n\n");

  const narrativeResponse = await invokeWithRetryAndTimeout(
    () =>
      llm.invoke([
        {
          role: "system",
          content:
            "Kamu adalah pencerita islami. Tulis cerita singkat (3-4 paragraf) dalam Bahasa Indonesia yang menggambarkan dampak nyata dari donasi ini. Ceritakan perjalanan dari niat donatur hingga manfaat yang dirasakan penerima. Gunakan bahasa yang menyentuh, penuh syukur, dan dibuka dengan Alhamdulillah. Jangan gunakan markdown (**, #, bullet), jangan tampilkan <think>, dan jangan tampilkan catatan internal.",
        },
        {
          role: "user",
          content: `Nama donatur: ${donorName}\nJenis donasi: ${typeLabel}\nKampanye: ${campaignName}\nKategori: ${category}\nNominal: ${amount}`,
        },
      ]),
    {
      timeoutMs: aiRuntime.llmTimeoutMs,
      maxRetries: aiRuntime.llmMaxRetries,
      initialRetryDelayMs: aiRuntime.llmInitialRetryDelayMs,
      operationName: "impact.narrative_generation",
    },
  ).catch(() => null);

  const narrativeRaw = narrativeResponse
    ? String(narrativeResponse.content)
    : fallbackNarrative;
  const narrative = sanitizeCardNarrativeOutput(narrativeRaw).trim();

  if (!narrative) {
    return NextResponse.json({
      narrative: sanitizeCardNarrativeOutput(fallbackNarrative),
    });
  }

  return NextResponse.json({ narrative });
}
