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
import {
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface ReconciliationResult {
  mayarPaidTransactions: number;
  localPendingDonations: number;
  mismatchesFound: number;
  donationsFixed: number;
  page: number;
  pageSize: number;
}

interface MismatchItem {
  mayarId: string;
  amount: number;
  paidAt: string | null;
}

export default function ReconcilePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconciliationResult | null>(null);
  const [mismatches, setMismatches] = useState<MismatchItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function runReconciliation() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: 1, pageSize: 100 }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Rekonsiliasi gagal");
        return;
      }

      setResult(data.reconciliation);
      setMismatches(data.mismatches ?? []);
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
          Rekonsiliasi Transaksi
        </h1>
        <p className="text-sm text-muted-foreground">
          Sinkronkan data transaksi Mayar dengan database lokal
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Jalankan Rekonsiliasi</CardTitle>
          <CardDescription>
            Membandingkan transaksi paid di Mayar dengan donasi pending di
            database. Donasi yang tidak sinkron akan otomatis diperbaiki.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runReconciliation} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="mr-2 size-4" />
            )}
            {loading ? "Memproses..." : "Mulai Rekonsiliasi"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="mr-2 inline size-4" />
          {error}
        </div>
      )}

      {result && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Transaksi Mayar (Paid)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold">
                {result.mayarPaidTransactions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Donasi Pending Lokal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold">
                {result.localPendingDonations}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Ketidaksesuaian</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold text-yellow-600">
                {result.mismatchesFound}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Donasi Diperbaiki</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-bold text-brand-green-deep">
                {result.donationsFixed}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {result && result.mismatchesFound === 0 && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <CheckCircle2 className="size-6 text-brand-green-deep" />
            <p className="text-brand-green-deep font-medium">
              Semua data sudah sinkron! Tidak ada ketidaksesuaian.
            </p>
          </CardContent>
        </Card>
      )}

      {mismatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Ketidaksesuaian (Sudah Diperbaiki)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mismatches.map((m) => (
                <div
                  key={m.mayarId}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Invoice: {m.mayarId.slice(0, 12)}...
                    </p>
                    {m.paidAt && (
                      <p className="text-xs text-muted-foreground">
                        Paid: {new Date(m.paidAt).toLocaleDateString("id-ID")}
                      </p>
                    )}
                  </div>
                  <p className="font-heading font-bold">
                    {formatRupiah(m.amount)}
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
