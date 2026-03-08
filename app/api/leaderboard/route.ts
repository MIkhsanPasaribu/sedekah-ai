// ============================================================
// GET /api/leaderboard — Top donors leaderboard (anonymized)
// ============================================================

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function anonymizeName(name: string | null): string {
  if (!name || name.trim() === "") return "Dermawan Anonim";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const initials = parts
    .slice(1)
    .map((w) => w[0]?.toUpperCase() + ".")
    .join(" ");
  return `${parts[0]} ${initials}`;
}

function getMilestoneLabel(total: number): string {
  if (total >= 10_000_000) return "🏆 Pejuang Zakat";
  if (total >= 5_000_000) return "💎 Dermawan Utama";
  if (total >= 1_000_000) return "⭐ Jutawan Amal";
  if (total >= 500_000) return "🌿 Sahabat Dhuafa";
  return "🤲 Donatur";
}

export async function GET(): Promise<NextResponse> {
  try {
    // Aggregate paid donations by user
    const grouped = await prisma.donation.groupBy({
      by: ["userId"],
      where: { status: "paid" },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 20,
    });

    if (grouped.length === 0) {
      return NextResponse.json({ leaderboard: [] });
    }

    // Fetch user names
    const userIds = grouped.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const leaderboard = grouped.map((entry, index) => {
      const totalAmount = entry._sum.amount ?? 0;
      return {
        rank: index + 1,
        name: anonymizeName(userMap.get(entry.userId) ?? null),
        totalAmount,
        donationCount: entry._count.id,
        milestone: getMilestoneLabel(totalAmount),
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("[leaderboard]", error);
    return NextResponse.json(
      { error: "Gagal memuat leaderboard" },
      { status: 500 },
    );
  }
}
