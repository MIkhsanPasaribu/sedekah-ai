"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import {
  DONATION_LIMITS,
  validateDirectDonationForm,
} from "@/lib/validations/donation";

const PRESET_AMOUNTS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

interface Campaign {
  id: string;
  name: string;
  collectedAmount: number;
  targetAmount: number;
  laz: string;
}

interface DonateFormProps {
  campaign: Campaign;
}

export function DonateForm({ campaign }: DonateFormProps) {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100_000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const effectiveAmount =
    selectedAmount !== null
      ? selectedAmount
      : parseInt(customAmount.replace(/\D/g, ""), 10) || 0;

  function handleCustomInput(val: string): void {
    setSelectedAmount(null);
    setCustomAmount(val.replace(/\D/g, ""));
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");

    const validation = validateDirectDonationForm({
      name: name.trim(),
      email: email.trim(),
      amount: effectiveAmount,
      message: message.trim() || undefined,
    });

    if (!validation.success) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/donations/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: campaign.id,
          amount: effectiveAmount,
          name: validation.data.name,
          email: validation.data.email,
          message: validation.data.message,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(
          json.error ??
            "Sepertinya ada yang kurang lengkap. Mohon periksa kembali.",
        );
        return;
      }

      window.location.href = json.paymentLink;
    } catch {
      setError("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  const percentage = Math.min(
    100,
    Math.round((campaign.collectedAmount / campaign.targetAmount) * 100),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Campaign Summary (left sidebar on desktop) */}
      <div className="lg:col-span-2">
        <div className="sticky top-6 rounded-2xl border border-ink-ghost bg-surface-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-ink-black leading-snug mb-1">
            {campaign.name}
          </h2>
          <p className="text-xs text-ink-mid mb-4">oleh {campaign.laz}</p>

          <div className="mb-2 flex justify-between text-xs text-ink-mid">
            <span>Terkumpul</span>
            <span>{percentage}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-brand-green-ghost overflow-hidden">
            <div
              className="h-2 rounded-full bg-brand-green-deep transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between">
            <p className="text-base font-bold text-brand-green-deep">
              {formatRupiah(campaign.collectedAmount)}
            </p>
            <p className="text-xs text-ink-mid self-end">
              dari {formatRupiah(campaign.targetAmount)}
            </p>
          </div>

          {/* Ayat */}
          <div className="mt-5 rounded-xl bg-brand-gold-ghost p-4 text-center">
            <p
              className="font-amiri text-base leading-relaxed text-brand-gold-deep mb-1"
              dir="rtl"
              lang="ar"
            >
              مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَٰلَهُمْ فِى سَبِيلِ ٱللَّهِ
              كَمَثَلِ حَبَّةٍ
            </p>
            <p className="text-[11px] text-ink-mid italic">
              QS Al-Baqarah 2:261
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-3">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-ink-ghost bg-surface-white p-6 shadow-sm space-y-5"
        >
          <h2 className="text-base font-bold text-ink-black">Detail Donasi</h2>

          {/* Preset amounts */}
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-mid">
              Pilih nominal donasi
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition-colors ${
                    selectedAmount === amt
                      ? "border-brand-green-deep bg-brand-green-deep text-white"
                      : "border-ink-ghost bg-white text-ink-dark hover:border-brand-green-light"
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="mt-2 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-mid">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Nominal lain..."
                value={selectedAmount === null ? customAmount : ""}
                onFocus={() => setSelectedAmount(null)}
                onChange={(e) => handleCustomInput(e.target.value)}
                className="w-full rounded-xl border border-ink-ghost bg-white pl-8 pr-3 py-2.5 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-deep focus:outline-none"
              />
            </div>
          </div>

          {/* Name + Email */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-mid">
                Nama donatur
              </label>
              <input
                type="text"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
                className="w-full rounded-xl border border-ink-ghost bg-white px-3 py-2.5 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-deep focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-mid">
                Email
              </label>
              <input
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-ink-ghost bg-white px-3 py-2.5 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-deep focus:outline-none"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-mid">
              Pesan & doa (opsional)
            </label>
            <textarea
              placeholder="Semoga donasi ini bermanfaat dan menjadi amal jariyah..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-xl border border-ink-ghost bg-white px-3 py-2.5 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-deep focus:outline-none"
            />
            <p className="mt-0.5 text-right text-[10px] text-ink-light">
              {message.length}/500
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-danger-light px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {/* Summary */}
          {effectiveAmount >= DONATION_LIMITS.MIN_AMOUNT && (
            <div className="rounded-xl bg-brand-green-ghost px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-ink-mid">Total donasi</p>
              <p className="text-xl font-bold text-brand-green-deep">
                {formatRupiah(effectiveAmount)}
              </p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || effectiveAmount < DONATION_LIMITS.MIN_AMOUNT}
            className="w-full rounded-xl bg-brand-green-deep py-4 text-sm font-bold text-white transition-colors hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Memproses...
              </span>
            ) : (
              `💚 Donasi ${effectiveAmount >= DONATION_LIMITS.MIN_AMOUNT ? formatRupiah(effectiveAmount) : "Sekarang"}`
            )}
          </button>

          <p className="text-center text-[11px] text-ink-light">
            Anda akan diarahkan ke halaman pembayaran Mayar yang aman.
          </p>
        </form>

        {/* Back button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 flex items-center gap-1.5 text-sm text-ink-mid hover:text-ink-dark"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 fill-none stroke-current stroke-2"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Kembali ke kampanye
        </button>
      </div>
    </div>
  );
}
