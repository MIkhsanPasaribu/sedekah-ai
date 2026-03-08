import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignFilter } from "@/components/campaigns/CampaignFilter";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Kampanye — SEDEKAH.AI",
  description:
    "Temukan kampanye donasi terpercaya yang telah diverifikasi oleh Fraud Shield AI.",
};

interface CampaignsPageProps {
  searchParams: Promise<{ kategori?: string }>;
}

export default async function CampaignsPage({
  searchParams,
}: CampaignsPageProps) {
  const { kategori } = await searchParams;

  // Enum values in schema match URL params directly (yatim, bencana, etc.)
  const validCategories = [
    "yatim",
    "bencana",
    "kesehatan",
    "pendidikan",
    "pangan",
  ];
  const dbCategory =
    kategori && validCategories.includes(kategori) ? kategori : undefined;

  const campaigns = await prisma.campaign.findMany({
    where: {
      isActive: true,
      ...(dbCategory
        ? {
            category: dbCategory as
              | "yatim"
              | "bencana"
              | "kesehatan"
              | "pendidikan"
              | "pangan",
          }
        : {}),
    },
    orderBy: [{ trustScore: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-ink-black sm:text-3xl">
              Kampanye Terverifikasi 🛡️
            </h1>
            <p className="mt-1 text-sm text-ink-mid">
              Setiap kampanye telah dianalisis oleh Fraud Shield AI untuk
              keamanan donasi Anda.
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className="shrink-0 rounded-lg bg-brand-green-deep px-4 py-2 text-sm font-medium text-white hover:bg-brand-green-mid transition"
          >
            + Buat Kampanye
          </Link>
        </div>

        {/* Filter */}
        <CampaignFilter activeCategory={kategori ?? null} />

        {/* Campaign Grid */}
        {campaigns.length > 0 ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                id={c.id}
                name={c.name}
                description={c.description}
                laz={c.laz}
                lazVerified={c.lazVerified}
                targetAmount={c.targetAmount}
                collectedAmount={c.collectedAmount}
                trustScore={c.trustScore ?? 0}
                category={c.category}
                region={c.region}
              />
            ))}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <p className="text-4xl">🕌</p>
            <p className="mt-4 text-lg font-medium text-ink-dark">
              Belum ada kampanye untuk kategori ini
            </p>
            <p className="mt-1 text-sm text-ink-mid">
              Coba pilih kategori lain atau lihat semua kampanye.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
