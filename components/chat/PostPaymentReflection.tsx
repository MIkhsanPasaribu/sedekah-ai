"use client";

import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

interface PostPaymentReflectionProps {
  amount: number;
  donorIntent: string | null;
  islamicContext: string | null;
}

const REFLECTION_MESSAGES: Record<string, string> = {
  zakat_mal:
    "Anda telah menunaikan kewajiban zakat harta. Harta yang dizakati menjadi harta yang bersih dan penuh berkah.",
  zakat_fitrah:
    "Zakat fitrah Anda menyucikan puasa Ramadhan dan membahagiakan saudara kita yang membutuhkan di hari raya.",
  sedekah:
    "Sedekah Anda adalah cahaya yang menerangi jalan Anda di dunia dan akhirat. Setiap rupiah membawa doa.",
  infaq:
    "Infaq Anda di jalan Allah menjadi investasi abadi. Tidak ada kebaikan yang sia-sia di sisi-Nya.",
  wakaf:
    "Wakaf Anda menjadi amal jariyah yang pahalanya terus mengalir bahkan saat Anda tertidur.",
  bencana:
    "Bantuan Anda meringankan beban saudara kita yang tertimpa musibah. Allah mencintai hamba yang saling menolong.",
};

const DEFAULT_REFLECTION =
  "Setiap rupiah sedekah yang Anda keluarkan adalah bukti keimanan dan kasih sayang kepada sesama.";

export function PostPaymentReflection({
  amount,
  donorIntent,
  islamicContext,
}: PostPaymentReflectionProps) {
  const reflection =
    (donorIntent && REFLECTION_MESSAGES[donorIntent]) ?? DEFAULT_REFLECTION;

  return (
    <div className="mx-4 my-3 overflow-hidden rounded-2xl border border-brand-green-pale bg-gradient-to-b from-brand-green-ghost to-white shadow-md">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-green-deep to-brand-green-mid px-5 py-4 text-center">
        <p className="text-3xl">🤲</p>
        <h3 className="mt-1 text-lg font-bold text-white">
          Barakallah Fiik!
        </h3>
        <p className="mt-1 text-sm text-brand-green-ghost">
          Pembayaran Anda telah berhasil dikonfirmasi
        </p>
      </div>

      {/* Amount */}
      <div className="border-b border-brand-green-pale bg-brand-green-ghost/30 px-5 py-4 text-center">
        <p className="text-sm text-ink-mid">Total Donasi</p>
        <p className="mt-1 text-2xl font-bold text-brand-green-deep">
          {formatRupiah(amount)}
        </p>
      </div>

      {/* Spiritual Reflection */}
      <div className="px-5 py-4">
        <p className="text-sm leading-relaxed text-ink-dark">{reflection}</p>

        {islamicContext && (
          <div className="mt-3 rounded-xl border border-brand-gold-pale bg-brand-gold-ghost p-3">
            <p className="text-xs italic text-brand-gold-deep">
              📖 {islamicContext}
            </p>
          </div>
        )}

        <p className="mt-3 text-center arabic-text text-lg text-brand-gold-deep">
          جَزَاكَ اللَّهُ خَيْرًا
        </p>
        <p className="mt-1 text-center text-xs italic text-ink-mid">
          Semoga Allah membalas kebaikan Anda dengan yang lebih baik
        </p>
      </div>

      {/* CTA */}
      <div className="border-t border-brand-green-pale px-5 py-4">
        <Link
          href="/dashboard"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green-deep px-4 py-3 font-medium text-white transition hover:bg-brand-green-mid"
        >
          📊 Lihat Dampak Donasi Anda
        </Link>
      </div>
    </div>
  );
}
