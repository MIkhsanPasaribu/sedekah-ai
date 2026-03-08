import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRupiah } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Banknote, ArrowRightLeft, Tag, TrendingUp } from "lucide-react";

export default async function AdminPage() {
  // Aggregate stats
  const [campaignCount, totalCollected, pendingDisbursements, totalDisbursed] =
    await Promise.all([
      prisma.campaign.count({ where: { isActive: true } }),
      prisma.campaign.aggregate({ _sum: { collectedAmount: true } }),
      prisma.disbursement.count({ where: { status: "pending" } }),
      prisma.disbursement.aggregate({
        where: { status: { in: ["completed", "verified"] } },
        _sum: { amount: true },
      }),
    ]);

  const collected = totalCollected._sum.collectedAmount ?? 0;
  const disbursed = totalDisbursed._sum.amount ?? 0;
  const undisbursed = collected - disbursed;

  const stats = [
    {
      label: "Total Terkumpul",
      value: formatRupiah(collected),
      icon: TrendingUp,
      color: "text-brand-green-deep",
    },
    {
      label: "Sudah Disalurkan",
      value: formatRupiah(disbursed),
      icon: Banknote,
      color: "text-brand-green-light",
    },
    {
      label: "Belum Disalurkan",
      value: formatRupiah(undisbursed),
      icon: ArrowRightLeft,
      color: "text-brand-gold-core",
    },
    {
      label: "Kampanye Aktif",
      value: campaignCount.toString(),
      icon: Tag,
      color: "text-brand-green-mid",
    },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-green-deep">
          Admin Panel
        </h1>
        <p className="text-sm text-muted-foreground">
          Kelola penyaluran dana, rekonsiliasi, dan promo
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardDescription>{stat.label}</CardDescription>
                <Icon className={`size-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <p className="font-heading text-xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Penyaluran Dana</CardTitle>
            <CardDescription>
              Kelola penyaluran ke LAZ dan penerima manfaat
              {pendingDisbursements > 0 && (
                <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                  {pendingDisbursements} pending
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/admin/disbursements" />}
              className="w-full"
            >
              <Banknote className="mr-2 size-4" />
              Kelola Penyaluran
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekonsiliasi</CardTitle>
            <CardDescription>
              Sinkronkan data transaksi Mayar dengan database lokal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/admin/reconcile" />}
              variant="outline"
              className="w-full"
            >
              <ArrowRightLeft className="mr-2 size-4" />
              Rekonsiliasi
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Promo & Diskon</CardTitle>
            <CardDescription>
              Buat kupon diskon untuk kampanye Ramadhan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              render={<Link href="/admin/discounts" />}
              variant="outline"
              className="w-full"
            >
              <Tag className="mr-2 size-4" />
              Kelola Promo
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
