// ============================================================
// API Route — Delete a Conversation
// ============================================================
// Deletes a conversation and all its messages (cascade)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
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

  // Cascade delete: messages are deleted automatically via onDelete: Cascade
  await prisma.conversation.delete({
    where: { id: conversation.id },
  });

  return NextResponse.json({ success: true });
}
