import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { DonateForm } from "./DonateForm";
import Link from "next/link";

interface DonatePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DonatePageProps) {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!campaign) return { title: "Kampanye Tidak Ditemukan" };
  return {
    title: `Donasi — ${campaign.name} | SEDEKAH.AI`,
    description: `Donasikan untuk "${campaign.name}" melalui SEDEKAH.AI. Aman, transparan, dan terpercaya.`,
  };
}

export default async function DonatePage({ params }: DonatePageProps) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id, isActive: true },
    select: {
      id: true,
      name: true,
      laz: true,
      targetAmount: true,
      collectedAmount: true,
    },
  });

  if (!campaign) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-ink-mid">
          <Link href="/campaigns" className="hover:text-ink-dark">
            Kampanye
          </Link>
          <span>/</span>
          <Link
            href={`/campaigns/${id}`}
            className="hover:text-ink-dark max-w-[200px] truncate"
          >
            {campaign.name}
          </Link>
          <span>/</span>
          <span className="text-ink-dark font-medium">Donasi</span>
        </nav>

        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-ink-black">
            Form Donasi 💚
          </h1>
          <p className="mt-1 text-sm text-ink-mid">
            Isi form di bawah untuk melanjutkan ke halaman pembayaran yang aman.
          </p>
        </div>

        <DonateForm campaign={campaign} />
      </div>
    </div>
  );
}
