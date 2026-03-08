"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { value: "yatim", label: "Yatim", emoji: "👶" },
  { value: "bencana", label: "Bencana", emoji: "🌊" },
  { value: "kesehatan", label: "Kesehatan", emoji: "🏥" },
  { value: "pendidikan", label: "Pendidikan", emoji: "📚" },
  { value: "pangan", label: "Pangan", emoji: "🍚" },
];

export function CampaignForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const payload = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      category,
      region: formData.get("region") as string,
      laz: formData.get("laz") as string,
      targetAmount: Number(formData.get("targetAmount")),
      endsAt: (formData.get("endsAt") as string) || undefined,
    };

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        return;
      }

      router.push("/campaigns");
      router.refresh();
    } catch {
      setError("Koneksi gagal. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/campaigns"
          className="mb-6 inline-flex items-center gap-1 text-sm text-ink-mid hover:text-ink-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Kampanye
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-xl text-ink-black">
              Buat Kampanye Baru 🕌
            </CardTitle>
            <CardDescription>
              Kampanye baru akan memiliki Trust Score awal 50 (Belum
              Diverifikasi). Fraud Shield AI akan menganalisisnya secara
              otomatis.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Nama kampanye */}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Kampanye</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  minLength={5}
                  placeholder="Contoh: Beasiswa Yatim Dhuafa Nusantara"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  minLength={20}
                  rows={4}
                  placeholder="Jelaskan tujuan, target penerima, dan rencana penyaluran dana..."
                />
              </div>

              {/* Kategori - button group */}
              <div className="space-y-2">
                <Label>Kategori</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`rounded-full border px-4 py-2 text-sm transition ${
                        category === cat.value
                          ? "border-brand-green-deep bg-brand-green-deep text-white"
                          : "border-ink-ghost bg-white text-ink-dark hover:border-brand-green-light"
                      }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
                {/* Hidden required validation */}
                <input
                  type="hidden"
                  name="category"
                  value={category}
                  required
                />
              </div>

              {/* LAZ / Organisasi */}
              <div className="space-y-2">
                <Label htmlFor="laz">LAZ / Organisasi Pengelola</Label>
                <Input
                  id="laz"
                  name="laz"
                  required
                  minLength={3}
                  placeholder="Contoh: BAZNAS, Dompet Dhuafa, Rumah Zakat"
                />
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label htmlFor="region">Wilayah</Label>
                <Input
                  id="region"
                  name="region"
                  required
                  minLength={2}
                  placeholder="Contoh: Nasional, DKI Jakarta, Jawa Barat"
                />
              </div>

              {/* Target donasi */}
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Donasi (Rp)</Label>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  type="number"
                  required
                  min={100000}
                  step={1000}
                  placeholder="100000"
                />
              </div>

              {/* Tanggal berakhir */}
              <div className="space-y-2">
                <Label htmlFor="endsAt">
                  Tanggal Berakhir{" "}
                  <span className="text-ink-light">(opsional)</span>
                </Label>
                <Input
                  id="endsAt"
                  name="endsAt"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-lg border border-danger/30 bg-danger-light p-3 text-sm text-danger">
                  {error}
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={isSubmitting || !category}
                className="w-full bg-brand-green-deep hover:bg-brand-green-mid"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membuat Kampanye...
                  </>
                ) : (
                  "Buat Kampanye"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
