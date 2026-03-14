"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah } from "@/lib/utils";
import {
  DONATION_LIMITS,
  validateDirectDonationForm,
} from "@/lib/validations/donation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PRESET_AMOUNTS = [25_000, 50_000, 100_000, 250_000, 500_000];

interface DirectDonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
}

export function DirectDonationModal({
  open,
  onOpenChange,
  campaignId,
  campaignName,
}: DirectDonationModalProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(100_000);
  const [customAmount, setCustomAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from session
  useEffect(() => {
    if (!open) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      if (!user) return;
      setEmail(user.email ?? "");
      const meta = user.user_metadata as Record<string, string> | undefined;
      if (meta?.full_name) setName(meta.full_name);
      else if (meta?.name) setName(meta.name);
    });
  }, [open]);

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
          campaignId,
          amount: effectiveAmount,
          name: validation.data.name,
          email: validation.data.email,
          message: validation.data.message,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(
          json.error ?? "Sepertinya ada yang kurang lengkap. Coba lagi ya.",
        );
        return;
      }

      // Redirect to Mayar payment page
      window.location.href = json.paymentLink;
    } catch {
      setError("Koneksi bermasalah. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-ink-black">
            Donasi untuk Kampanye
          </DialogTitle>
          <DialogDescription className="text-xs text-ink-mid line-clamp-2">
            {campaignName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {/* Preset amounts */}
          <div>
            <p className="mb-2 text-xs font-semibold text-ink-mid">
              Pilih nominal
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
                  className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                    selectedAmount === amt
                      ? "border-brand-green-deep bg-brand-green-deep text-white"
                      : "border-ink-ghost bg-white text-ink-dark hover:border-brand-green-light"
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedAmount(null);
                  setCustomAmount("");
                }}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition-colors ${
                  selectedAmount === null
                    ? "border-brand-green-deep bg-brand-green-deep text-white"
                    : "border-ink-ghost bg-white text-ink-dark hover:border-brand-green-light"
                }`}
              >
                Lainnya
              </button>
            </div>

            {selectedAmount === null && (
              <div className="mt-2 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-mid">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Masukkan nominal"
                  value={customAmount}
                  onChange={(e) => handleCustomInput(e.target.value)}
                  className="w-full rounded-lg border border-ink-ghost bg-white pl-8 pr-3 py-2 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-deep focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-mid">
              Nama donatur
            </label>
            <input
              type="text"
              placeholder="Masukkan nama"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              className="w-full rounded-lg border border-ink-ghost bg-white px-3 py-2 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-deep focus:outline-none"
            />
          </div>

          {/* Email */}
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
              className="w-full rounded-lg border border-ink-ghost bg-white px-3 py-2 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-deep focus:outline-none"
            />
          </div>

          {/* Optional message */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-mid">
              Pesan doa (opsional)
            </label>
            <textarea
              placeholder="Semoga bermanfaat..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full resize-none rounded-lg border border-ink-ghost bg-white px-3 py-2 text-sm text-ink-dark placeholder:text-ink-light focus:border-brand-green-deep focus:outline-none"
            />
          </div>

          {error && <p className="text-xs text-danger">{error}</p>}

          {/* Summary */}
          {effectiveAmount >= DONATION_LIMITS.MIN_AMOUNT && (
            <div className="rounded-lg bg-brand-green-ghost px-3 py-2">
              <p className="text-xs text-ink-mid">Total donasi</p>
              <p className="text-lg font-bold text-brand-green-deep">
                {formatRupiah(effectiveAmount)}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || effectiveAmount < DONATION_LIMITS.MIN_AMOUNT}
            className="w-full rounded-xl bg-brand-green-deep py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green-mid disabled:cursor-not-allowed disabled:opacity-60"
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
              "💚 Lanjut ke Pembayaran"
            )}
          </button>

          {/* Islamic quote */}
          <p className="text-center text-[10px] text-ink-light leading-relaxed">
            مَن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا — QS 2:245
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
