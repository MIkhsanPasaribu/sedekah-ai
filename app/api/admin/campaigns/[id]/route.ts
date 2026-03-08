import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { campaignUpdateSchema } from "@/lib/validations/campaign";
import { requireAdmin } from "@/lib/auth/admin";
import { ZodError } from "zod";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
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
