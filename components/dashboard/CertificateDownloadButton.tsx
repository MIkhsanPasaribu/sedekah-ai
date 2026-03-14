"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";

interface CertificateDownloadButtonProps {
  donationId: string;
}

export function CertificateDownloadButton({
  donationId,
}: CertificateDownloadButtonProps) {
  const [loadingPng, setLoadingPng] = useState(false);

  async function handleDownloadPng() {
    setLoadingPng(true);
    try {
      const res = await fetch(`/api/donations/${donationId}/certificate`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sertifikat-donasi-${donationId.slice(0, 8)}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Gagal mengunduh sertifikat PNG", error);
      window.open(`/api/donations/${donationId}/certificate/html`, "_blank");
    } finally {
      setLoadingPng(false);
    }
  }

  function handlePrintPdf() {
    window.open(`/api/donations/${donationId}/certificate/html`, "_blank");
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={handleDownloadPng}
        disabled={loadingPng}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-green-deep bg-white py-3 text-sm font-bold text-brand-green-deep transition hover:bg-brand-green-ghost disabled:opacity-60"
      >
        <Download className="h-4 w-4" />
        {loadingPng ? "Memuat..." : "Unduh PNG"}
      </button>
      <button
        onClick={handlePrintPdf}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-brand-green-deep bg-brand-green-deep py-3 text-sm font-bold text-white transition hover:bg-brand-green-mid"
      >
        <FileText className="h-4 w-4" />
        Cetak / PDF
      </button>
    </div>
  );
}
