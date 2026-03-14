// ============================================================
// API Route — Impact Narrative: AI-generated donation story
// ============================================================
// POST — Generate personalized narrative from donation data

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ChatGroq } from "@langchain/groq";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";

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
    model: "qwen/qwen3-32b",
    temperature: 0.7,
    apiKey: process.env.GROQ_API_KEY,
  });

  const donorName = donation.user?.name ?? "Donatur";
  const campaignName = donation.campaign?.name ?? "Donasi Umum";
  const category = donation.campaign?.category ?? "";
  const amount = formatRupiah(donation.amount);
  const typeLabel = donation.type.replace(/_/g, " ");

  const res = await llm.invoke([
    {
      role: "system",
      content:
        "Kamu adalah pencerita islami. Tulis cerita singkat (3-4 paragraf) dalam Bahasa Indonesia yang menggambarkan dampak nyata dari donasi ini. Ceritakan perjalanan dari niat donatur hingga manfaat yang dirasakan penerima. Gunakan bahasa yang menyentuh, penuh syukur, dan dibuka dengan Alhamdulillah.",
    },
    {
      role: "user",
      content: `Nama donatur: ${donorName}\nJenis donasi: ${typeLabel}\nKampanye: ${campaignName}\nKategori: ${category}\nNominal: ${amount}`,
    },
  ]);

  const narrative = String(res.content).trim();

  return NextResponse.json({ narrative });
}
