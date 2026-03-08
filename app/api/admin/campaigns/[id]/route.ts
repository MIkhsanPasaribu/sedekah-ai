import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { campaignUpdateSchema } from "@/lib/validations/campaign";
import { ZodError } from "zod";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

function isAdmin(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = campaignUpdateSchema.parse(body);

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) {
      return NextResponse.json(
        { error: "Kampanye tidak ditemukan" },
        { status: 404 },
      );
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined && { name: parsed.name }),
        ...(parsed.description !== undefined && {
          description: parsed.description,
        }),
        ...(parsed.isActive !== undefined && { isActive: parsed.isActive }),
        ...(parsed.trustScore !== undefined && {
          trustScore: parsed.trustScore,
        }),
      },
    });

    return NextResponse.json({ success: true, campaign: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "Data tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[Admin Campaigns PATCH]:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui kampanye" },
      { status: 500 },
    );
  }
}
