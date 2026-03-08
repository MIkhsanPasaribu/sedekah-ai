"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Tag, CheckCircle2 } from "lucide-react";

interface CreatedDiscount {
  id: string;
  name: string;
  code: string;
  amount: number;
  type: "percentage" | "fixed";
}

export default function DiscountsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [createdDiscounts, setCreatedDiscounts] = useState<CreatedDiscount[]>(
    [],
  );

  // Form
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [maxUsage, setMaxUsage] = useState("");

  async function handleCreate() {
    if (!name || !code || !amount) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          code,
          amount: Number(amount),
          type,
          maxUsage: maxUsage ? Number(maxUsage) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat promo");
        return;
      }

      setCreatedDiscounts((prev) => [data.discount, ...prev]);
      setSuccess(
        `Promo "${name}" berhasil dibuat dengan kode ${code.toUpperCase()}`,
      );
      setName("");
      setCode("");
      setAmount("");
      setMaxUsage("");
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-brand-green-deep">
          Promo & Diskon
        </h1>
        <p className="text-sm text-muted-foreground">
          Buat kupon diskon untuk kampanye Ramadhan via Mayar
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="size-4" />
          {success}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Buat Promo Baru</CardTitle>
          <CardDescription>
            Kupon akan dibuat langsung di Mayar dan bisa digunakan saat
            pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="promo-name">Nama Promo</Label>
              <Input
                id="promo-name"
                placeholder="Ramadhan Berkah 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-code">Kode Promo</Label>
              <Input
                id="promo-code"
                placeholder="RAMADHAN2026"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="promo-type">Tipe</Label>
              <select
                id="promo-type"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={type}
                onChange={(e) =>
                  setType(e.target.value as "percentage" | "fixed")
                }
              >
                <option value="percentage">Persen (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-amount">
                {type === "percentage" ? "Persentase" : "Nominal (Rp)"}
              </Label>
              <Input
                id="promo-amount"
                type="number"
                placeholder={type === "percentage" ? "10" : "50000"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-usage">Maks. Penggunaan (opsional)</Label>
              <Input
                id="max-usage"
                type="number"
                placeholder="100"
                value={maxUsage}
                onChange={(e) => setMaxUsage(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleCreate} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            Buat Promo
          </Button>
        </CardContent>
      </Card>

      {createdDiscounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Promo Dibuat (Sesi Ini)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {createdDiscounts.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Tag className="size-4 text-brand-gold-core" />
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {d.code}
                      </p>
                    </div>
                  </div>
                  <p className="font-heading font-bold">
                    {d.type === "percentage"
                      ? `${d.amount}%`
                      : `Rp ${d.amount.toLocaleString("id-ID")}`}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
