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
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { formatRupiah } from "@/lib/utils";

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

  const dailyNudge = getDailyNudge(ramadhanDay, donatedToday);

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
      beneficiaries: Math.floor(amount / 50000), // Estimate ~Rp50k per beneficiary
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

        {/* Donation History */}
        <div className="mt-6 pb-4">
          <DonationHistory donations={donationHistory} />
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Daily Nudge Messages — 30 pesan kontekstual Ramadhan
// -------------------------------------------------------

const RAMADHAN_NUDGES: Record<number, { donated: string; notDonated: string }> =
  {
    1: {
      donated:
        "Masya Allah, Ramadhan baru dimulai dan Anda sudah bersedekah! Semoga istiqamah 30 hari ke depan. 🤲",
      notDonated:
        "Selamat datang di Ramadhan! Hari pertama penuh berkah — mulai kebaikan dengan sedekah hari ini.",
    },
    7: {
      donated:
        "Alhamdulillah, seminggu penuh kebaikan! Streak Anda luar biasa. Terus jaga momentum ini. 🔥",
      notDonated:
        "Satu minggu Ramadhan sudah berlalu. Belum terlambat untuk memulai streak kebaikan Anda hari ini.",
    },
    10: {
      donated:
        "Sepertiga Ramadhan sudah lewat — dan Anda konsisten bersedekah. Semoga Allah lipat gandakan. ✨",
      notDonated:
        "10 hari pertama Ramadhan (hari rahmat) hampir berakhir. Manfaatkan sisa waktunya dengan berdonasi.",
    },
    15: {
      donated:
        "Nishfu Ramadhan! Setengah perjalanan sudah Anda lalui dengan kebaikan. Subhanallah! 🌙",
      notDonated:
        "Hari ke-15 — kita memasuki 10 hari kedua (hari pengampunan). Sedekah hari ini bisa jadi pembuka pintu maghfirah.",
    },
    20: {
      donated:
        "Memasuki 10 malam terakhir! Sedekah Anda di malam-malam ini bisa bernilai 1000 bulan. 🕌",
      notDonated:
        "10 malam terakhir Ramadhan dimulai! Di salah satu malam ini ada Lailatul Qadr. Jangan lewatkan.",
    },
    21: {
      donated:
        "Malam ganjil pertama dari 10 terakhir. Perbanyak ibadah dan sedekah — Anda sudah di jalur yang tepat!",
      notDonated:
        "Malam ke-21 — salah satu malam yang dicari. Sedekah malam ini bernilai istimewa.",
    },
    25: {
      donated:
        "Lima hari lagi! Semangat Anda di Ramadhan ini sangat menginspirasi. Terus bersedekah. 💪",
      notDonated:
        "Tinggal 5 hari lagi Ramadhan berakhir. Masih ada waktu untuk mengumpulkan pahala sebanyak-banyaknya.",
    },
    27: {
      donated:
        "Malam ke-27 — malam yang paling banyak dicari sebagai Lailatul Qadr. Sedekah Anda istimewa! ✨",
      notDonated:
        "Malam ke-27 Ramadhan! Banyak ulama berpendapat ini adalah Lailatul Qadr. Sedekah satu malam ini = 1000 bulan.",
    },
    29: {
      donated:
        "Ramadhan hampir usai. Alhamdulillah atas semua kebaikan yang telah Anda tabur. Semoga diterima Allah. 🤲",
      notDonated:
        "Satu hari lagi sebelum Ramadhan berakhir. Tutup bulan suci ini dengan sedekah terakhir Anda.",
    },
    30: {
      donated:
        "Hari terakhir Ramadhan! Masya Allah, perjalanan kebaikan Anda di bulan ini sungguh luar biasa. Selamat Hari Raya! 🎉",
      notDonated:
        "Hari terakhir Ramadhan. Jangan lupa zakat fitrah! Tutup Ramadhan dengan kebaikan. Selamat Hari Raya! 🎉",
    },
  };

function getDailyNudge(
  ramadhanDay: number,
  donatedToday: boolean,
): string | null {
  if (ramadhanDay <= 0 || ramadhanDay > 30) return null;

  // Cek apakah ada pesan spesifik untuk hari ini
  const specific = RAMADHAN_NUDGES[ramadhanDay];
  if (specific) {
    return donatedToday ? specific.donated : specific.notDonated;
  }

  // Generic nudge berdasarkan fase Ramadhan
  if (donatedToday) {
    return `Alhamdulillah, Anda sudah bersedekah di hari ke-${ramadhanDay} Ramadhan. Semoga Allah menerima amal ibadah Anda. 🤲`;
  }

  if (ramadhanDay <= 10) {
    return `Hari ke-${ramadhanDay} — fase rahmat Ramadhan. Sedekah hari ini membuka pintu rahmat-Nya yang luas.`;
  }
  if (ramadhanDay <= 20) {
    return `Hari ke-${ramadhanDay} — fase maghfirah. Sedekah di hari-hari ini menjadi wasilah pengampunan.`;
  }
  return `Hari ke-${ramadhanDay} — 10 malam terakhir! Setiap malam bisa jadi Lailatul Qadr. Jangan lewatkan sedekah malam ini.`;
}
