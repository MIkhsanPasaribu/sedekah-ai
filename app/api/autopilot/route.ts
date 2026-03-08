import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { autopilotConfigSchema } from "@/lib/validations/donation";
import { ZodError } from "zod";

export async function GET(): Promise<NextResponse> {
  try {
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
      return NextResponse.json({ config: null });
    }

    const config = await prisma.autopilotConfig.findUnique({
      where: { userId: dbUser.id },
    });

    return NextResponse.json({ config });
  } catch (error) {
    console.error("[Autopilot GET]:", error);
    return NextResponse.json(
      { error: "Gagal memuat konfigurasi" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
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
      return NextResponse.json(
        { error: "Profil tidak ditemukan" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = autopilotConfigSchema.parse(body);

    // Calculate next run: first day next month at 07:00 WIB
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
      0,
      0,
      0,
      0,
    ); // UTC midnight

    const config = await prisma.autopilotConfig.upsert({
      where: { userId: dbUser.id },
      update: {
        monthlyAmount: parsed.monthlyAmount,
        categories: parsed.categories,
        isActive: parsed.isActive,
        nextRunAt: parsed.isActive ? nextRun : null,
      },
      create: {
        userId: dbUser.id,
        monthlyAmount: parsed.monthlyAmount,
        categories: parsed.categories,
        isActive: parsed.isActive,
        nextRunAt: parsed.isActive ? nextRun : null,
      },
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues[0]?.message ?? "Data tidak valid";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("[Autopilot POST]:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan konfigurasi" },
      { status: 500 },
    );
  }
}
