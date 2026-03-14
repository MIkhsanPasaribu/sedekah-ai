import { StatCard } from "@/components/dashboard/StatCard";
import { RamadhanHeatmap } from "@/components/dashboard/RamadhanHeatmap";
import { DonationHistory } from "@/components/dashboard/DonationHistory";
import { ImpactSummary } from "@/components/dashboard/ImpactSummary";
import {
  MilestoneGrid,
  DEFAULT_BADGES,
} from "@/components/dashboard/MilestoneGrid";
import { StreakCounter } from "@/components/dashboard/StreakCounter";
import { DailyNudgeCard } from "@/components/dashboard/DailyNudgeCard";
import { AutopilotCard } from "@/components/dashboard/AutopilotCard";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  formatRupiah,
  getDailyNudge,
  estimateBeneficiaries,
} from "@/lib/utils";
import { generateAiNudge } from "@/lib/nudge";
import { FraudAlertNotification } from "@/components/dashboard/FraudAlertNotification";

export const metadata = {
  title: "Dashboard — SEDEKAH.AI",
  description:
    "Pantau perjalanan kebaikan Anda: donasi, streak Ramadhan, dan dampak nyata.",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user data
  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: {
      donations: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { campaign: { select: { name: true } } },
      },
      givingJourney: true,
    },
  });

  // Compute stats
  const paidDonations =
    dbUser?.donations.filter((d) => d.status === "paid") ?? [];
  const totalDonated = paidDonations.reduce(
    (sum: number, d: { amount: number }) => sum + d.amount,
    0,
  );
  const totalCount = paidDonations.length;
  const uniqueCampaigns = new Set(
    paidDonations.map((d: { campaignId: string | null }) => d.campaignId),
  ).size;

  // Ramadhan heatmap data — generate 30 days
  const ramadhanStart = new Date("2026-02-17");
  const heatmapData = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const dayDate = new Date(ramadhanStart);
    dayDate.setDate(dayDate.getDate() + i);

    const dayDonations = paidDonations.filter((d: { createdAt: Date }) => {
      const dDate = new Date(d.createdAt);
      return (
        dDate.getFullYear() === dayDate.getFullYear() &&
        dDate.getMonth() === dayDate.getMonth() &&
        dDate.getDate() === dayDate.getDate()
      );
    });

    return {
      day,
      donated: dayDonations.length > 0,
      amount: dayDonations.reduce(
        (sum: number, d: { amount: number }) => sum + d.amount,
        0,
      ),
    };
  });

  const streak = dbUser?.ramadhanStreak ?? 0;

  // Daily nudge — pesan kontekstual per hari Ramadhan
  const today = new Date();
  const ramadhanDay =
    today >= ramadhanStart && today <= new Date("2026-03-18")
      ? Math.floor((today.getTime() - ramadhanStart.getTime()) / 86_400_000) + 1
      : 0;

  const donatedToday = heatmapData.some(
    (d) => d.day === ramadhanDay && d.donated,
  );

  // Last donation category for personalized nudge
  const lastCategory = paidDonations[0]?.type ?? null;

  // AI-powered daily nudge with static fallback
  const dailyNudge = dbUser
    ? await generateAiNudge(
        dbUser.id,
        ramadhanDay,
        donatedToday,
        streak,
        lastCategory,
      )
    : getDailyNudge(ramadhanDay, donatedToday);

  // Impact data by category
  const categoryMap = new Map<string, { amount: number; count: number }>();
  for (const d of paidDonations) {
    const type = d.type;
    const existing = categoryMap.get(type) ?? { amount: 0, count: 0 };
    categoryMap.set(type, {
      amount: existing.amount + d.amount,
      count: existing.count + 1,
    });
  }

  const categories = Array.from(categoryMap.entries()).map(
    ([name, { amount, count }]) => ({
      name,
      amount,
      percentage:
        totalDonated > 0 ? Math.round((amount / totalDonated) * 100) : 0,
      beneficiaries: estimateBeneficiaries(amount, name),
    }),
  );

  const totalBeneficiaries = categories.reduce(
    (s, c) => s + c.beneficiaries,
    0,
  );
  const impactScore = Math.min(100, Math.round(totalDonated / 100000));

  // Donation history
  const donationHistory =
    dbUser?.donations.map(
      (d: {
        id: string;
        amount: number;
        type: string;
        campaign: { name: string } | null;
        status: string;
        createdAt: Date;
        islamicContext: string | null;
      }) => ({
        id: d.id,
        amount: d.amount,
        type: d.type,
        campaignName: d.campaign?.name ?? "Tidak diketahui",
        status: d.status as "pending" | "paid" | "failed" | "expired",
        createdAt: d.createdAt.toISOString(),
        islamicContext: d.islamicContext,
      }),
    ) ?? [];

  // Milestones
  const milestones = DEFAULT_BADGES.map((badge) => {
    let achieved = false;
    switch (badge.id) {
      case "first-zakat":
        achieved = paidDonations.some((d: { type: string }) =>
          d.type.includes("zakat"),
        );
        break;
      case "streak-7":
        achieved = streak >= 7;
        break;
      case "million-club":
        achieved = totalDonated >= 1000000;
        break;
      case "five-campaigns":
        achieved = uniqueCampaigns >= 5;
        break;
      case "ramadhan-complete":
        achieved = streak >= 30;
        break;
      case "impact-hero":
        achieved = totalBeneficiaries >= 100;
        break;
      default:
        break;
    }
    return { ...badge, achieved };
  });

  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-heading font-bold text-ink-black sm:text-3xl">
            Assalamu&apos;alaikum, {dbUser?.name ?? "Dermawan"} 💚
          </h1>
          <p className="mt-1 text-sm text-ink-mid">
            Pantau perjalanan kebaikan Anda di bulan penuh berkah.
          </p>
        </div>

        {/* Daily Nudge — Pesan AI Harian */}
        {dailyNudge && ramadhanDay > 0 && (
          <div className="mb-6">
            <DailyNudgeCard
              ramadhanDay={ramadhanDay}
              donatedToday={donatedToday}
              nudgeMessage={dailyNudge}
              streak={streak}
            />
          </div>
        )}

        {/* Fraud Alerts */}
        <div className="mb-6">
          <FraudAlertNotification />
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Donasi"
            value={formatRupiah(totalDonated)}
            subtitle="Sepanjang Ramadhan"
            icon="trending"
          />
          <StatCard
            title="Transaksi Sukses"
            value={totalCount}
            subtitle={`${uniqueCampaigns} kampanye berbeda`}
            icon="heart"
          />
          <StatCard
            title="Penerima Manfaat"
            value={totalBeneficiaries}
            subtitle="Estimasi Impact Genome"
            icon="users"
          />
          <StatCard
            title="Streak Ramadhan"
            value={`${streak} hari`}
            subtitle="Donasi berturut-turut"
            icon="target"
          />
        </div>

        {/* Streak Counter + Heatmap + Impact */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StreakCounter streak={streak} ramadhanDay={ramadhanDay} />
          <RamadhanHeatmap data={heatmapData} streak={streak} />
          <ImpactSummary
            totalDonated={totalDonated}
            totalBeneficiaries={totalBeneficiaries}
            impactScore={impactScore}
            categories={categories}
          />
        </div>

        {/* Milestones */}
        <div className="mt-6">
          <MilestoneGrid badges={milestones} />
        </div>

        {/* Autopilot */}
        <div className="mt-6">
          <AutopilotCard />
        </div>

        {/* Donation History */}
        <div className="mt-6 pb-4">
          <DonationHistory donations={donationHistory} />
        </div>
      </div>
    </div>
  );
}
