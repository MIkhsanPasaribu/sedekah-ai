// ============================================================
// API Route — Admin: Single Disbursement Management
// ============================================================
// PATCH — Update status / add transfer proof

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";

export const runtime = "nodejs";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing"],
  processing: ["completed"],
  completed: ["verified"],
};

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
  const { status, transferProof, notes } = body;

  const disbursement = await prisma.disbursement.findUnique({
    where: { id },
  });

  if (!disbursement) {
    return NextResponse.json(
      { error: "Penyaluran tidak ditemukan" },
      { status: 404 },
    );
  }

  const updateData: Record<string, unknown> = {};

  // Status transition
  if (status) {
    const allowed = VALID_TRANSITIONS[disbursement.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Tidak bisa mengubah status dari "${disbursement.status}" ke "${status}". Transisi yang diizinkan: ${allowed?.join(", ") ?? "tidak ada"}`,
        },
        { status: 400 },
      );
    }
    updateData.status = status;

    if (status === "completed" || status === "processing") {
      updateData.disbursedAt = new Date();
    }
    if (status === "verified") {
      updateData.verifiedAt = new Date();
    }
  }

  if (transferProof !== undefined) {
    updateData.transferProof = transferProof;
  }

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  if (body.bankName !== undefined) {
    updateData.bankName = body.bankName;
  }

  if (body.accountHolder !== undefined) {
    updateData.accountHolder = body.accountHolder;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada data yang diupdate" },
      { status: 400 },
    );
  }

  const updated = await prisma.disbursement.update({
    where: { id },
    data: updateData,
    include: {
      campaign: { select: { name: true, laz: true } },
      disbursedBy: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({ success: true, disbursement: updated });
}
