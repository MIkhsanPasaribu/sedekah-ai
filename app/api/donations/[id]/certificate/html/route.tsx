// ============================================================
// GET /api/donations/[id]/certificate/html — Printable HTML Certificate
// Returns a complete HTML page that the browser can print to PDF
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatRupiahSimple(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateSimple(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export async function GET(
  _req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const donation = await prisma.donation.findUnique({
    where: { id },
    include: {
      campaign: { select: { name: true } },
      user: { select: { authId: true, name: true } },
    },
  });

  if (!donation || donation.user?.authId !== user.id) {
    return NextResponse.json(
      { error: "Donasi tidak ditemukan" },
      { status: 404 },
    );
  }

  if (donation.status !== "paid") {
    return NextResponse.json(
      { error: "Sertifikat hanya tersedia untuk donasi yang sudah dibayar" },
      { status: 400 },
    );
  }

  const donorName = donation.user?.name ?? "Donatur SEDEKAH.AI";
  const campaignName = donation.campaign?.name ?? "Donasi Umum";
  const amount = formatRupiahSimple(donation.amount);
  const date = formatDateSimple(donation.createdAt);
  const typeLabel = donation.type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const doa = donation.islamicContext
    ? donation.islamicContext
    : '"Perumpamaan orang yang menginfakkan hartanya di jalan Allah seperti sebutir biji yang menumbuhkan tujuh tangkai." — QS 2:261';

  const safeDonorName = escapeHtml(donorName);
  const safeCampaignName = escapeHtml(campaignName);
  const safeAmount = escapeHtml(amount);
  const safeDate = escapeHtml(date);
  const safeTypeLabel = escapeHtml(typeLabel);
  const safeDoa = escapeHtml(doa);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Sertifikat Donasi — ${donorName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; min-height: 100%; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #FAF3E0; padding: 2rem; }
    .page { min-height: calc(100vh - 4rem); display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .cert { width: 900px; max-width: 100%; background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%); border-radius: 24px; padding: 42px 48px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .gold-bar { position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #92620A, #C9A227, #E8C55A, #C9A227, #92620A); }
    .gold-bar-bottom { position: absolute; bottom: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, #92620A, #C9A227, #E8C55A, #C9A227, #92620A); }
    .logo { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 24px; }
    .logo-icon { width: 48px; height: 48px; background: #C9A227; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: #1B4332; font-weight: 800; }
    .logo-text { text-align: left; }
    .logo-name { color: #E8C55A; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
    .logo-sub { color: #74C69D; font-size: 12px; letter-spacing: 2px; }
    .label { color: #D8F3DC; font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 16px; }
    .dots { color: #C9A227; font-size: 18px; margin-bottom: 16px; }
    .donor-name { color: #FFFFFF; font-size: 32px; font-weight: 800; margin-bottom: 6px; }
    .verb { color: #74C69D; font-size: 14px; margin-bottom: 20px; }
    .amount-box { background: rgba(255,255,255,0.12); border: 1px solid rgba(201,162,39,0.4); border-radius: 16px; padding: 16px 40px; display: inline-block; margin-bottom: 16px; }
    .amount { color: #E8C55A; font-size: 34px; font-weight: 800; }
    .campaign { color: #D8F3DC; font-size: 14px; margin-bottom: 6px; }
    .campaign strong { color: #FFFFFF; }
    .date { color: #74C69D; font-size: 12px; margin-bottom: 20px; }
    .doa { color: #C9A227; font-size: 12px; font-style: italic; max-width: 600px; margin: 0 auto; line-height: 1.6; }
    .print-btn { margin-top: 2rem; padding: 12px 32px; background: #C9A227; color: #1B4332; font-weight: 700; font-size: 15px; border: none; border-radius: 10px; cursor: pointer; font-family: inherit; }
    .print-btn:hover { background: #E8C55A; }
    @page { size: A4 landscape; margin: 10mm; }
    @media print {
      html, body { width: 297mm; height: 210mm; }
      body { background: #fff; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .page { width: 100%; height: 100%; min-height: 100%; }
      .cert { width: 100%; max-width: none; box-shadow: none; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="cert">
      <div class="gold-bar"></div>
      <div class="logo">
        <div class="logo-icon">SAI</div>
        <div class="logo-text">
          <div class="logo-name">SEDEKAH.AI</div>
          <div class="logo-sub">AMIL DIGITAL TERPERCAYA</div>
        </div>
      </div>
      <div class="label">Sertifikat Donasi</div>
      <div class="dots">---</div>
      <div class="donor-name">${safeDonorName}</div>
      <div class="verb">telah menunaikan ${safeTypeLabel}</div>
      <div class="amount-box">
        <div class="amount">${safeAmount}</div>
      </div>
      <div class="campaign">Disalurkan untuk: <strong>${safeCampaignName}</strong></div>
      <div class="date">${safeDate}</div>
      <div class="doa">${safeDoa}</div>
      <div class="gold-bar-bottom"></div>
    </div>
    <button class="print-btn" onclick="window.print()">Cetak / Simpan PDF</button>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
