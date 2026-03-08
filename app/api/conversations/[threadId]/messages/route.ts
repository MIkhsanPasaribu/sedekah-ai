// ============================================================
// API Route — Get Messages for a Conversation
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
): Promise<NextResponse> {
  const { threadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { threadId },
    select: {
      id: true,
      threadId: true,
      title: true,
      user: { select: { authId: true } },
    },
  });

  if (!conversation) {
    return NextResponse.json(
      { error: "Percakapan tidak ditemukan" },
      { status: 404 },
    );
  }

  // Ownership check
  if (conversation.user.authId !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      content: true,
      metadata: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    threadId: conversation.threadId,
    title: conversation.title,
    messages,
  });
}
