import { prisma } from "@/lib/prisma";
import { DisbursementManager } from "@/components/admin/DisbursementManager";

export const metadata = {
  title: "Penyaluran Dana — Admin SEDEKAH.AI",
};

export default async function DisbursementsPage() {
  const [disbursements, campaigns] = await Promise.all([
    prisma.disbursement.findMany({
      include: {
        campaign: { select: { name: true, laz: true } },
        disbursedBy: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.campaign.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        laz: true,
        collectedAmount: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize dates for client component
  const serializedDisbursements = disbursements.map((d) => ({
    ...d,
    amount: d.amount,
    createdAt: d.createdAt.toISOString(),
    disbursedAt: d.disbursedAt?.toISOString() ?? null,
    verifiedAt: d.verifiedAt?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-green-deep">
          Penyaluran Dana
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola penyaluran dana ke LAZ dan penerima manfaat
        </p>
      </div>

      <DisbursementManager
        initialDisbursements={serializedDisbursements}
        campaigns={campaigns}
      />
    </div>
  );
}
