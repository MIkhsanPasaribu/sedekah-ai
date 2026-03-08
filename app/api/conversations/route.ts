// ============================================================
// API Route — List User Conversations
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true },
  });

  if (!dbUser) {
    return NextResponse.json({ conversations: [] });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: dbUser.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      threadId: true,
      title: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ conversations });
}
