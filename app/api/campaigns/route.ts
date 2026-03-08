import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = [
  "yatim",
  "bencana",
  "kesehatan",
  "pendidikan",
  "pangan",
] as const;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { name, description, category, region, laz, targetAmount, endsAt } =
      body as {
        name?: string;
        description?: string;
        category?: string;
        region?: string;
        laz?: string;
        targetAmount?: number;
        endsAt?: string;
      };

    // Validation
    if (!name || name.trim().length < 5) {
      return NextResponse.json(
        { error: "Nama kampanye minimal 5 karakter" },
        { status: 400 },
      );
    }
    if (!description || description.trim().length < 20) {
      return NextResponse.json(
        { error: "Deskripsi minimal 20 karakter" },
        { status: 400 },
      );
    }
    if (
      !category ||
      !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])
    ) {
      return NextResponse.json(
        { error: "Kategori tidak valid" },
        { status: 400 },
      );
    }
    if (!region || region.trim().length < 2) {
      return NextResponse.json(
        { error: "Region tidak valid" },
        { status: 400 },
      );
    }
    if (!laz || laz.trim().length < 3) {
      return NextResponse.json(
        { error: "Nama LAZ/organisasi minimal 3 karakter" },
        { status: 400 },
      );
    }
    if (!targetAmount || targetAmount < 100_000) {
      return NextResponse.json(
        { error: "Target donasi minimal Rp 100.000" },
        { status: 400 },
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        category: category as (typeof VALID_CATEGORIES)[number],
        region: region.trim(),
        laz: laz.trim(),
        lazVerified: false,
        targetAmount,
        collectedAmount: 0,
        trustScore: 50,
        trustBreakdown: {
          narrative: 13,
          financial: 12,
          organizational: 13,
          temporal: 12,
        },
        isActive: true,
        fraudFlags: 0,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    console.error("[Campaign API Error]:", error);
    return NextResponse.json(
      { error: "Gagal membuat kampanye" },
      { status: 500 },
    );
  }
}
