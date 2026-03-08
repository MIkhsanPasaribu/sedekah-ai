import { Navbar } from "@/components/shared/Navbar";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import { TrustScoreBadge } from "@/components/shared/TrustScoreBadge";
import { Card, CardHeader, CardContent } from "@/components/shared/Card";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Heart,
  Users,
  Sparkles,
} from "lucide-react";

interface ImpactDetailPageProps {
  params: Promise<{ donationId: string }>;
}

export default async function ImpactDetailPage({
  params,
}: ImpactDetailPageProps) {
  const { donationId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: {
      campaign: true,
      user: { select: { authId: true, name: true } },
    },
  });

  if (!donation || donation.user?.authId !== user.id) {
    notFound();
  }

  const statusConfig: Record<
    string,
    {
      label: string;
      icon: typeof CheckCircle2;
      color: string;
    }
  > = {
    paid: { label: "Sukses", icon: CheckCircle2, color: "text-success" },
    pending: { label: "Menunggu", icon: Clock, color: "text-warning" },
    failed: { label: "Gagal", icon: XCircle, color: "text-danger" },
    expired: { label: "Kedaluwarsa", icon: XCircle, color: "text-ink-mid" },
  };

  const status = statusConfig[donation.status] ?? statusConfig.pending;
  const StatusIcon = status.icon;

  const estimatedBeneficiaries = Math.floor(donation.amount / 50000);
  const impactScore =
    donation.impactScore ?? Math.min(100, Math.round(donation.amount / 100000));

  return (
    <div className="min-h-screen bg-surface-warm">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Back */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-brand-green-deep hover:text-brand-green-mid"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Dashboard
        </Link>

        {/* Donation Detail */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-ink-black">
                  Detail Donasi
                </h1>
                <p className="mt-1 text-sm text-ink-mid">
                  {formatTanggal(donation.createdAt)}
                </p>
              </div>
              <div className={`flex items-center gap-1.5 ${status.color}`}>
                <StatusIcon className="h-5 w-5" />
                <span className="text-sm font-medium">{status.label}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Amount */}
              <div className="rounded-xl bg-brand-green-ghost p-4 text-center">
                <p className="text-3xl font-bold text-brand-green-deep">
                  {formatRupiah(donation.amount)}
                </p>
                <p className="mt-1 text-sm text-brand-green-mid capitalize">
                  {donation.type.toLowerCase().replace(/_/g, " ")}
                </p>
              </div>

              {/* Campaign Info */}
              {donation.campaign && (
                <div className="rounded-xl border border-ink-ghost p-4">
                  <p className="text-xs font-medium text-ink-mid">Kampanye</p>
                  <p className="mt-1 text-base font-bold text-ink-black">
                    {donation.campaign.name}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <TrustScoreBadge
                      score={donation.campaign.trustScore ?? 0}
                    />
                  </div>
                </div>
              )}

              {/* Islamic context */}
              {donation.islamicContext && (
                <div className="rounded-xl bg-brand-gold-ghost border border-brand-gold-pale p-4">
                  <p className="text-xs font-medium text-brand-gold-deep mb-2">
                    ✨ Konteks Islami
                  </p>
                  <p className="text-sm italic text-ink-dark leading-relaxed">
                    {donation.islamicContext}
                  </p>
                </div>
              )}

              {/* Impact Estimation (only for paid) */}
              {donation.status === "paid" && (
                <div className="rounded-xl border border-brand-green-pale bg-gradient-to-b from-brand-green-ghost/50 to-surface-white p-4">
                  <h3 className="text-sm font-bold text-ink-black mb-4">
                    🌱 Estimasi Dampak
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Heart className="mx-auto h-6 w-6 text-brand-green-light" />
                      <p className="mt-1 text-lg font-bold text-ink-black">
                        {formatRupiah(donation.amount)}
                      </p>
                      <p className="text-xs text-ink-mid">Tersalurkan</p>
                    </div>
                    <div>
                      <Users className="mx-auto h-6 w-6 text-brand-green-light" />
                      <p className="mt-1 text-lg font-bold text-ink-black">
                        {estimatedBeneficiaries}
                      </p>
                      <p className="text-xs text-ink-mid">Penerima</p>
                    </div>
                    <div>
                      <Sparkles className="mx-auto h-6 w-6 text-brand-gold-core" />
                      <p className="mt-1 text-lg font-bold text-ink-black">
                        {impactScore}
                      </p>
                      <p className="text-xs text-ink-mid">Impact Score</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Mayar Link */}
              {donation.mayarPaymentLink && donation.status === "pending" && (
                <a
                  href={donation.mayarPaymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full rounded-xl bg-brand-gold-core py-3 text-center font-bold text-brand-green-deep transition hover:bg-brand-gold-bright"
                >
                  Lanjutkan Pembayaran →
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
