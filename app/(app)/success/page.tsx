import Link from "next/link";
import { CheckCircle2, Heart, ArrowRight, Home } from "lucide-react";

export const metadata = {
  title: "Pembayaran Berhasil — SEDEKAH.AI",
  description: "Alhamdulillah, donasi Anda telah berhasil diproses.",
};

interface SuccessPageProps {
  searchParams: Promise<{
    amount?: string;
    type?: string;
    campaign?: string;
  }>;
}

export default async function SuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { amount, type, campaign } = await searchParams;

  const formattedAmount = amount
    ? new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(Number(amount))
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-warm px-4">
      <div className="w-full max-w-md text-center">
        {/* Success Animation */}
        <div className="relative mx-auto mb-8">
          {/* Glow ring */}
          <div className="absolute inset-0 mx-auto h-28 w-28 animate-ping rounded-full bg-success/20" />
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-success-light">
            <CheckCircle2 className="h-16 w-16 text-success" />
          </div>
        </div>

        {/* Main message */}
        <h1 className="text-2xl font-bold text-ink-black sm:text-3xl">
          Alhamdulillah! 🤲
        </h1>
        <p className="mt-3 text-ink-mid">
          Donasi Anda telah berhasil diproses. Semoga Allah melipatgandakan
          kebaikan Anda.
        </p>

        {/* Donation summary */}
        {formattedAmount && (
          <div className="mx-auto mt-8 rounded-2xl border border-brand-green-pale bg-brand-green-ghost p-6">
            <p className="text-sm text-brand-green-mid">Jumlah donasi</p>
            <p className="mt-1 text-3xl font-bold text-brand-green-deep">
              {formattedAmount}
            </p>
            {type && (
              <p className="mt-1 text-sm text-brand-green-mid capitalize">
                {type.toLowerCase().replace(/_/g, " ")}
              </p>
            )}
            {campaign && (
              <p className="mt-2 text-sm text-ink-mid">
                Kampanye:{" "}
                <span className="font-medium text-ink-dark">{campaign}</span>
              </p>
            )}
          </div>
        )}

        {/* Islamic quote */}
        <div className="mx-auto mt-8 rounded-xl bg-brand-gold-ghost border border-brand-gold-pale p-4">
          <p className="arabic-text text-lg text-brand-gold-deep">
            مَنْ ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا
          </p>
          <p className="mt-2 text-sm italic text-ink-mid">
            &ldquo;Siapakah yang mau memberi pinjaman kepada Allah, pinjaman
            yang baik...&rdquo;
          </p>
          <p className="mt-1 text-xs text-ink-light">— QS. Al-Baqarah: 245</p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-green-deep px-6 py-3 font-medium text-white transition hover:bg-brand-green-mid"
          >
            <Heart className="h-4 w-4" />
            Lihat Dampak Donasi
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-brand-green-deep px-6 py-3 font-medium text-brand-green-deep transition hover:bg-brand-green-ghost"
          >
            Donasi Lagi
          </Link>
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-1 text-sm text-ink-mid hover:text-ink-dark"
        >
          <Home className="h-4 w-4" />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
