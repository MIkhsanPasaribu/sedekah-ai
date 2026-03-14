// ============================================================
// API Route — Agent Ops Snapshot (Admin Only)
// ============================================================

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getAgentOpsSnapshot } from "@/lib/agent/observability";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  return NextResponse.json(getAgentOpsSnapshot(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
