"use client";

import { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/utils";

interface AutopilotConfig {
  id: string;
  monthlyAmount: number;
  categories: string[];
  isActive: boolean;
  nextRunAt: string | null;
  lastRunAt: string | null;
}

const CATEGORY_OPTIONS = [
  { value: "yatim", label: "Yatim Piatu", emoji: "🧒" },
  { value: "bencana", label: "Bencana Alam", emoji: "🆘" },
  { value: "kesehatan", label: "Kesehatan", emoji: "🏥" },
  { value: "pendidikan", label: "Pendidikan", emoji: "📚" },
  { value: "pangan", label: "Pangan", emoji: "🌾" },
];

const PRESET_AMOUNTS = [50_000, 100_000, 250_000, 500_000];

export function AutopilotCard() {
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [amount, setAmount] = useState(100_000);
  const [categories, setCategories] = useState<string[]>(["yatim"]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/autopilot");
      const data = (await res.json()) as { config: AutopilotConfig | null };
      if (data.config) {
        setConfig(data.config);
        setAmount(data.config.monthlyAmount);
        setCategories(data.config.categories);
        setIsActive(data.config.isActive);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(value: string) {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    );
  }

  async function handleSave() {
    if (categories.length === 0) {
      setError("Pilih minimal 1 kategori donasi.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyAmount: amount, categories, isActive }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        config?: AutopilotConfig;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan");
        return;
      }
      if (data.config) setConfig(data.config);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-ghost bg-white p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-ink-ghost" />
        <div className="mt-4 h-20 rounded bg-ink-ghost" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-green-light/30 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading text-base font-semibold text-ink-black">
            🤖 Sedekah Autopilot
          </h3>
          <p className="mt-0.5 text-xs text-ink-mid">
            Donasi otomatis setiap bulan tanpa perlu diingat
          </p>
        </div>
        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={isActive}
          onClick={() => setIsActive((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none ${
            isActive ? "bg-brand-green-deep" : "bg-ink-ghost"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-white shadow-lg ring-0 transition-transform ${
              isActive ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Status badge */}
      {config && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {config.isActive ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-ghost px-3 py-1 text-xs font-medium text-brand-green-deep">
              ✅ Aktif
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-ink-ghost/50 px-3 py-1 text-xs font-medium text-ink-mid">
              ⏸ Tidak Aktif
            </span>
          )}
          {config.lastRunAt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-gold-ghost px-3 py-1 text-xs text-brand-gold-deep">
              Terakhir:{" "}
              {new Date(config.lastRunAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          {config.nextRunAt && config.isActive && (
            <span className="inline-flex items-center gap-1 rounded-full bg-info-light px-3 py-1 text-xs text-info">
              Jadwal:{" "}
              {new Date(config.nextRunAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      )}

      {/* Amount selector */}
      <div className="mt-5">
        <label className="text-xs font-medium text-ink-dark">
          Jumlah bulanan
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(preset)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                amount === preset
                  ? "border-brand-green-deep bg-brand-green-deep text-white"
                  : "border-ink-ghost bg-white text-ink-dark hover:border-brand-green-light"
              }`}
            >
              {formatRupiah(preset)}
            </button>
          ))}
          <input
            type="number"
            min={10000}
            step={10000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-32 rounded-lg border border-ink-ghost px-3 py-1.5 text-xs text-ink-dark focus:border-brand-green-deep focus:outline-none"
            placeholder="Jumlah lain"
          />
        </div>
        <p className="mt-1 text-xs text-ink-mid">
          Total:{" "}
          <span className="font-semibold text-brand-green-deep">
            {formatRupiah(amount)}
          </span>{" "}
          / bulan
        </p>
      </div>

      {/* Category selector */}
      <div className="mt-4">
        <label className="text-xs font-medium text-ink-dark">
          Prioritas kategori
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {CATEGORY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleCategory(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                categories.includes(opt.value)
                  ? "border-brand-green-deep bg-brand-green-deep text-white"
                  : "border-ink-ghost bg-white text-ink-dark hover:border-brand-green-light"
              }`}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && <p className="mt-3 text-xs text-danger">{error}</p>}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-5 w-full rounded-xl bg-brand-green-deep px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving
          ? "Menyimpan..."
          : config
            ? "Perbarui Autopilot"
            : "Aktifkan Autopilot"}
      </button>

      <p className="mt-2 text-center text-xs text-ink-light">
        &quot;Dan apa saja yang kamu infakkan, Allah akan menggantinya&quot; — QS Saba&apos;
        34:39
      </p>
    </div>
  );
}
