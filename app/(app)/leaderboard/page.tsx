import { formatRupiah } from "@/lib/utils";
import { prisma } from "@/lib/prisma";

export const revalidate = 300; // revalidate every 5 minutes

export const metadata = {
  title: "Leaderboard — SEDEKAH.AI",
  description:
    "Para donatur terbaik yang telah berkontribusi lewat SEDEKAH.AI.",
};

interface LeaderboardEntry {
  rank: number;
  name: string;
  totalAmount: number;
  donationCount: number;
  milestone: string;
}

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

async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const grouped = await prisma.donation.groupBy({
    by: ["userId"],
    where: { status: "paid" },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 20,
  });

  if (grouped.length === 0) return [];

  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  return grouped.map((entry, index) => {
    const totalAmount = entry._sum.amount ?? 0;
    return {
      rank: index + 1,
      name: anonymizeName(userMap.get(entry.userId) ?? null),
      totalAmount,
      donationCount: entry._count.id,
      milestone: getMilestoneLabel(totalAmount),
    };
  });
}

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-4xl mb-2">🏆</p>
          <h1 className="text-2xl font-heading font-bold text-ink-black sm:text-3xl">
            Leaderboard Donatur
          </h1>
          <p className="mt-2 text-sm text-ink-mid">
            Para pahlawan kebaikan yang telah berkontribusi melalui SEDEKAH.AI.
            Semoga Allah melipatgandakan pahala mereka.
          </p>

          {/* Ayat */}
          <div className="mt-5 inline-block rounded-2xl bg-brand-gold-ghost border border-brand-gold-pale px-5 py-3">
            <p
              className="font-amiri text-base text-brand-gold-deep leading-relaxed"
              dir="rtl"
              lang="ar"
            >
              مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ
              كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ
            </p>
            <p className="mt-1 text-[11px] text-ink-mid italic">
              QS Al-Baqarah 2:261
            </p>
          </div>
        </div>

        {/* Table */}
        {leaderboard.length === 0 ? (
          <div className="rounded-2xl border border-ink-ghost bg-surface-white p-12 text-center">
            <p className="text-4xl mb-3">🌱</p>
            <p className="font-medium text-ink-dark">Belum ada data donatur</p>
            <p className="mt-1 text-sm text-ink-mid">
              Jadilah yang pertama berdonasi!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry) => {
              const medal = RANK_MEDALS[entry.rank - 1] ?? `#${entry.rank}`;
              const isTop3 = entry.rank <= 3;

              return (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-4 rounded-2xl border px-5 py-4 transition-shadow hover:shadow-md ${
                    isTop3
                      ? "border-brand-gold-pale bg-brand-gold-ghost"
                      : "border-ink-ghost bg-surface-white"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-10 shrink-0 text-center text-2xl">
                    {medal}
                  </div>

                  {/* Name + milestone */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        isTop3 ? "text-brand-gold-deep" : "text-ink-dark"
                      }`}
                    >
                      {entry.name}
                    </p>
                    <p className="text-xs text-ink-mid">
                      {entry.milestone} · {entry.donationCount}× donasi
                    </p>
                  </div>

                  {/* Total */}
                  <div className="shrink-0 text-right">
                    <p
                      className={`font-bold text-base ${
                        isTop3
                          ? "text-brand-gold-deep"
                          : "text-brand-green-deep"
                      }`}
                    >
                      {formatRupiah(entry.totalAmount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimer */}
        <p className="mt-6 text-center text-xs text-ink-light">
          Nama donatur ditampilkan dalam format tersamarkan untuk menjaga
          privasi. Data diperbarui setiap 5 menit.
        </p>
      </div>
    </div>
  );
}
