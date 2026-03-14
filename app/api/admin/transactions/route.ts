// ============================================================
// API Route — Admin: Paid Transactions (Mayar Reconciliation)
// ============================================================
// GET — Proxy to GET /transaction/paid from Mayar API

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getPaidTransactions } from "@/lib/mayar/transaction";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page")
    ? Number(searchParams.get("page"))
    : undefined;
  const pageSize = searchParams.get("pageSize")
    ? Number(searchParams.get("pageSize"))
    : undefined;

  const data = await getPaidTransactions({ page, pageSize });

  return NextResponse.json(data);
}
