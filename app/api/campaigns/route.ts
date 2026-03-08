import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { campaignCreateSchema } from "@/lib/validations/campaign";
import { ZodError } from "zod";

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
    const parsed = campaignCreateSchema.parse(body);

    const campaign = await prisma.campaign.create({
      data: {
        name: parsed.name,
        description: parsed.description,
        category: parsed.category,
        region: parsed.region,
        laz: parsed.laz,
        lazVerified: false,
        targetAmount: parsed.targetAmount,
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
        endsAt: parsed.endsAt ? new Date(parsed.endsAt) : null,
      },
    });

    return NextResponse.json({ success: true, campaign });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "Data tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[Campaign API Error]:", error);
    return NextResponse.json(
      { error: "Gagal membuat kampanye" },
      { status: 500 },
    );
  }
}
