"use client";

import { useState } from "react";
import { formatRupiah } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldCheck,
} from "lucide-react";

// ---------- Types ----------

interface DisbursementItem {
  id: string;
  campaignId: string;
  amount: number;
  recipientLaz: string;
  recipientAccount: string | null;
  status: string;
  transferProof: string | null;
  notes: string | null;
  disbursedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  campaign: { name: string; laz: string };
  disbursedBy: { name: string | null; email: string } | null;
}

interface CampaignOption {
  id: string;
  name: string;
  laz: string;
  collectedAmount: number;
}

interface DisbursementManagerProps {
  initialDisbursements: DisbursementItem[];
  campaigns: CampaignOption[];
}

// ---------- Status badge ----------

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock,
  },
  processing: {
    label: "Diproses",
    color: "bg-blue-100 text-blue-800",
    icon: Loader2,
  },
  completed: {
    label: "Selesai",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  verified: {
    label: "Terverifikasi",
    color: "bg-emerald-100 text-emerald-900",
    icon: ShieldCheck,
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      <Icon className="size-3" />
      {config.label}
    </span>
  );
}

// ---------- Next status ----------

const NEXT_STATUS: Record<string, string> = {
  pending: "processing",
  processing: "completed",
  completed: "verified",
};

const NEXT_LABEL: Record<string, string> = {
  pending: "Proses",
  processing: "Selesai",
  completed: "Verifikasi",
};

// ---------- Main Component ----------

export function DisbursementManager({
  initialDisbursements,
  campaigns,
}: DisbursementManagerProps) {
  const [disbursements, setDisbursements] =
    useState<DisbursementItem[]>(initialDisbursements);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [amount, setAmount] = useState("");
  const [recipientAccount, setRecipientAccount] = useState("");
  const [notes, setNotes] = useState("");

  async function handleCreate() {
    if (!selectedCampaign || !amount) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/disbursements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId: selectedCampaign,
          amount: Number(amount),
          recipientAccount: recipientAccount || undefined,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal membuat penyaluran");
        return;
      }

      // Add to list
      const newItem: DisbursementItem = {
        ...data.disbursement,
        createdAt: data.disbursement.createdAt ?? new Date().toISOString(),
        disbursedAt: null,
        verifiedAt: null,
        disbursedBy: null,
      };
      setDisbursements((prev) => [newItem, ...prev]);

      // Reset form
      setSelectedCampaign("");
      setAmount("");
      setRecipientAccount("");
      setNotes("");
      setShowForm(false);
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvanceStatus(id: string, currentStatus: string) {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;

    try {
      const res = await fetch(`/api/admin/disbursements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mengubah status");
        return;
      }

      setDisbursements((prev) =>
        prev.map((d) =>
          d.id === id
            ? {
                ...d,
                status: data.disbursement.status,
                disbursedAt: data.disbursement.disbursedAt,
                verifiedAt: data.disbursement.verifiedAt,
              }
            : d,
        ),
      );
    } catch {
      setError("Terjadi kesalahan jaringan");
    }
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Create form toggle */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 size-4" />
          Buat Penyaluran Baru
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Penyaluran Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign">Kampanye</Label>
              <select
                id="campaign"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
              >
                <option value="">Pilih kampanye...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.laz} ({formatRupiah(c.collectedAmount)})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah (Rp)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Rekening Penerima (opsional)</Label>
              <Input
                id="account"
                placeholder="Bank — No. Rek — Nama"
                value={recipientAccount}
                onChange={(e) => setRecipientAccount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Keterangan penyaluran"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                Buat Penyaluran
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setError(null);
                }}
              >
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disbursement list */}
      <div className="space-y-3">
        {disbursements.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada penyaluran dana
            </CardContent>
          </Card>
        ) : (
          disbursements.map((d) => (
            <Card key={d.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="font-heading font-semibold">
                    {d.campaign.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {d.recipientLaz}
                    {d.recipientAccount && ` — ${d.recipientAccount}`}
                  </p>
                  {d.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {d.notes}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-heading text-lg font-bold text-brand-green-deep">
                    {formatRupiah(d.amount)}
                  </p>
                  <StatusBadge status={d.status} />
                  {NEXT_STATUS[d.status] && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdvanceStatus(d.id, d.status)}
                    >
                      {NEXT_LABEL[d.status]}
                      <ArrowRight className="ml-1 size-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
