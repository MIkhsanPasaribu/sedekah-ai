"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  PowerOff,
  Loader2,
  CheckCircle2,
  Building2,
} from "lucide-react";

// ---------- Types ----------

export interface LazPartnerItem {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
  createdAt: string;
}

interface LazPartnerManagerProps {
  initialPartners: LazPartnerItem[];
}

// ---------- Empty form state ----------

const emptyForm = {
  name: "",
  bankName: "",
  accountNumber: "",
  accountHolder: "",
};

// ---------- Main Component ----------

export function LazPartnerManager({ initialPartners }: LazPartnerManagerProps) {
  const [partners, setPartners] = useState<LazPartnerItem[]>(initialPartners);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  function setField(field: keyof typeof emptyForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  }

  function startEdit(partner: LazPartnerItem) {
    setEditingId(partner.id);
    setForm({
      name: partner.name,
      bankName: partner.bankName,
      accountNumber: partner.accountNumber,
      accountHolder: partner.accountHolder,
    });
    setError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit() {
    if (
      !form.name ||
      !form.bankName ||
      !form.accountNumber ||
      !form.accountHolder
    ) {
      setError("Semua field wajib diisi");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        // PATCH
        const res = await fetch(`/api/admin/laz-partners/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Gagal memperbarui LAZ Partner");
          return;
        }
        setPartners((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  name: data.lazPartner.name,
                  bankName: data.lazPartner.bankName,
                  accountNumber: data.lazPartner.accountNumber,
                  accountHolder: data.lazPartner.accountHolder,
                }
              : p,
          ),
        );
      } else {
        // POST
        const res = await fetch("/api/admin/laz-partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Gagal membuat LAZ Partner");
          return;
        }
        setPartners((prev) => [
          {
            id: data.lazPartner.id,
            name: data.lazPartner.name,
            bankName: data.lazPartner.bankName,
            accountNumber: data.lazPartner.accountNumber,
            accountHolder: data.lazPartner.accountHolder,
            isActive: data.lazPartner.isActive,
            createdAt: data.lazPartner.createdAt,
          },
          ...prev,
        ]);
      }
      cancelForm();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate(id: string) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/laz-partners/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menonaktifkan LAZ Partner");
        return;
      }
      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: false } : p)),
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

      {/* Create / Edit form */}
      {!showForm ? (
        <Button onClick={startCreate}>
          <Plus className="mr-2 size-4" />
          Tambah LAZ Partner
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? "Edit LAZ Partner" : "LAZ Partner Baru"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lp-name">Nama LAZ</Label>
              <Input
                id="lp-name"
                placeholder="Contoh: BAZNAS Pusat"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lp-bank">Nama Bank</Label>
              <Input
                id="lp-bank"
                placeholder="Contoh: BCA, BRI, Mandiri"
                value={form.bankName}
                onChange={(e) => setField("bankName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lp-account">Nomor Rekening</Label>
              <Input
                id="lp-account"
                placeholder="12345678901"
                value={form.accountNumber}
                onChange={(e) => setField("accountNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lp-holder">Nama Pemegang Rekening</Label>
              <Input
                id="lp-holder"
                placeholder="Nama sesuai rekening"
                value={form.accountHolder}
                onChange={(e) => setField("accountHolder", e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 size-4" />
                )}
                {editingId ? "Simpan Perubahan" : "Tambah Partner"}
              </Button>
              <Button variant="outline" onClick={cancelForm}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partners list */}
      <div className="space-y-3">
        {partners.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Belum ada LAZ Partner terdaftar
            </CardContent>
          </Card>
        ) : (
          partners.map((p) => (
            <Card key={p.id} className={!p.isActive ? "opacity-50" : ""}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 size-5 shrink-0 text-brand-green-light" />
                  <div className="space-y-0.5">
                    <p className="font-heading font-semibold">
                      {p.name}
                      {!p.isActive && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          (Nonaktif)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {p.bankName} — {p.accountNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      a/n {p.accountHolder}
                    </p>
                  </div>
                </div>

                {p.isActive && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(p)}
                    >
                      <Pencil className="mr-1 size-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeactivate(p.id)}
                    >
                      <PowerOff className="mr-1 size-3" />
                      Nonaktifkan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
