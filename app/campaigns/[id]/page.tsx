import { Navbar } from "@/components/shared/Navbar";
import { CampaignDetailCard } from "@/components/campaigns/CampaignDetailCard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CampaignDetailPageProps) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return { title: "Kampanye Tidak Ditemukan" };
  return {
    title: `${campaign.name} — SEDEKAH.AI`,
    description: campaign.description.slice(0, 160),
  };
}

export default async function CampaignDetailPage({
  params,
}: CampaignDetailPageProps) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      fraudAlerts: {
        select: {
          flagType: true,
          description: true,
          severity: true,
        },
      },
    },
  });

  if (!campaign) {
    notFound();
  }

  const trustBreakdown = campaign.trustBreakdown as Record<
    string,
    number
  > | null;

  return (
    <div className="min-h-screen bg-surface-warm">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <CampaignDetailCard
          id={campaign.id}
          name={campaign.name}
          description={campaign.description}
          laz={campaign.laz}
          lazVerified={campaign.lazVerified}
          targetAmount={campaign.targetAmount}
          collectedAmount={campaign.collectedAmount}
          trustScore={campaign.trustScore ?? 0}
          trustBreakdown={trustBreakdown}
          category={campaign.category}
          region={campaign.region}
          endsAt={campaign.endsAt?.toISOString() ?? null}
          fraudFlags={campaign.fraudAlerts}
        />
      </div>
    </div>
  );
}
