// ============================================================
// API Route — Admin: LAZ Partner Management
// ============================================================
// GET  — List LAZ Partners (optionally filter by isActive)
// POST — Create new LAZ Partner

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { lazPartnerCreateSchema } from "@/lib/validations/laz-partner";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const onlyActive = req.nextUrl.searchParams.get("active") !== "false";

  const lazPartners = await prisma.lazPartner.findMany({
    where: onlyActive ? { isActive: true } : undefined,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ success: true, lazPartners });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const body = await req.json();
  const parsed = lazPartnerCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const { name, bankName, accountNumber, accountHolder, isActive } =
    parsed.data;

  // Check for duplicate name
  const existing = await prisma.lazPartner.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: `LAZ Partner dengan nama "${name}" sudah terdaftar` },
      { status: 409 },
    );
  }

  const lazPartner = await prisma.lazPartner.create({
    data: { name, bankName, accountNumber, accountHolder, isActive },
  });

  return NextResponse.json({ success: true, lazPartner }, { status: 201 });
}
