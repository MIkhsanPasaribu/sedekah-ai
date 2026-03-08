import { prisma } from "@/lib/prisma";
import { LazPartnerManager } from "@/components/admin/LazPartnerManager";

export const metadata = {
  title: "LAZ Partners — Admin SEDEKAH.AI",
};

export default async function LazPartnersPage() {
  const partners = await prisma.lazPartner.findMany({
    orderBy: { name: "asc" },
  });

  const serializedPartners = partners.map((p) => ({
    id: p.id,
    name: p.name,
    bankName: p.bankName,
    accountNumber: p.accountNumber,
    accountHolder: p.accountHolder,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-green-deep">
          LAZ Partners
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola daftar Lembaga Amil Zakat mitra beserta data rekening resmi
          mereka
        </p>
      </div>

      <LazPartnerManager initialPartners={serializedPartners} />
    </div>
  );
}
