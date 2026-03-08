import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { error } = await requireAdmin();
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const isActive = searchParams.get("isActive");

    const where = isActive !== null ? { isActive: isActive === "true" } : {};

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { donations: true } } },
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({ campaigns, total, page, limit });
  } catch (error) {
    console.error("[Admin Campaigns GET]:", error);
    return NextResponse.json(
      { error: "Gagal memuat kampanye" },
      { status: 500 },
    );
  }
}
