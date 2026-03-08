import { prisma } from "@/lib/prisma";
import { DisbursementManager } from "@/components/admin/DisbursementManager";
import { formatRupiah } from "@/lib/utils";

export const metadata = {
  title: "Penyaluran Dana — Admin SEDEKAH.AI",
};

export default async function DisbursementsPage() {
  const [disbursements, activeCampaigns, lazPartners, disbursedAggregates] =
    await Promise.all([
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
      prisma.lazPartner.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          bankName: true,
          accountNumber: true,
          accountHolder: true,
        },
      }),
      prisma.disbursement.groupBy({
        by: ["campaignId"],
        where: { status: { notIn: ["pending"] } },
        _sum: { amount: true },
      }),
    ]);

  // Build per-campaign balance map
  const disbursedMap = new Map(
    disbursedAggregates.map((d) => [d.campaignId, d._sum.amount ?? 0]),
  );

  const campaigns = activeCampaigns.map((c) => ({
    ...c,
    undisbursedBalance: c.collectedAmount - (disbursedMap.get(c.id) ?? 0),
  }));

  // Balance summary for the table (only campaigns with collected > 0)
  const balanceSummary = campaigns
    .filter((c) => c.collectedAmount > 0)
    .sort((a, b) => b.undisbursedBalance - a.undisbursedBalance);

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

      {/* Balance Summary Table */}
      {balanceSummary.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="font-heading text-sm font-semibold text-brand-green-deep">
              Ringkasan Saldo per Kampanye
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Kampanye</th>
                  <th className="px-4 py-2 font-medium">LAZ</th>
                  <th className="px-4 py-2 text-right font-medium">
                    Terkumpul
                  </th>
                  <th className="px-4 py-2 text-right font-medium">
                    Disalurkan
                  </th>
                  <th className="px-4 py-2 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {balanceSummary.map((c) => {
                  const disbursed = disbursedMap.get(c.id) ?? 0;
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{c.name}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {c.laz}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatRupiah(c.collectedAmount)}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                        {formatRupiah(disbursed)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-semibold tabular-nums ${
                          c.undisbursedBalance > 0
                            ? "text-brand-green-deep"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatRupiah(c.undisbursedBalance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DisbursementManager
        initialDisbursements={serializedDisbursements}
        campaigns={campaigns}
        lazPartners={lazPartners}
      />
    </div>
  );
}
