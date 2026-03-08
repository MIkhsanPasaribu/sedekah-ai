// ============================================================
// API Route — Admin: LAZ Partner — Single Record
// ============================================================
// PATCH  — Update LAZ Partner fields
// DELETE — Deactivate (soft delete) a LAZ Partner

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { lazPartnerUpdateSchema } from "@/lib/validations/laz-partner";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = lazPartnerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 },
    );
  }

  const existing = await prisma.lazPartner.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "LAZ Partner tidak ditemukan" },
      { status: 404 },
    );
  }

  // Check unique name collision if name is being changed
  if (parsed.data.name && parsed.data.name !== existing.name) {
    const nameConflict = await prisma.lazPartner.findUnique({
      where: { name: parsed.data.name },
    });
    if (nameConflict) {
      return NextResponse.json(
        {
          error: `LAZ Partner dengan nama "${parsed.data.name}" sudah terdaftar`,
        },
        { status: 409 },
      );
    }
  }

  const lazPartner = await prisma.lazPartner.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ success: true, lazPartner });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const { id } = await params;

  const existing = await prisma.lazPartner.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: "LAZ Partner tidak ditemukan" },
      { status: 404 },
    );
  }

  // Soft delete — deactivate rather than hard delete to preserve FK integrity
  const lazPartner = await prisma.lazPartner.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true, lazPartner });
}
