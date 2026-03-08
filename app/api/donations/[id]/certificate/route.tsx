// ============================================================
// GET /api/donations/[id]/certificate — Donation certificate image
// Uses next/og ImageResponse — no extra dependencies needed
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{ id: string }>;
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
  req: NextRequest,
  { params }: RouteContext,
): Promise<Response> {
  const { id } = await params;

  // Auth check
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

  return new ImageResponse(
    <div
      style={{
        width: "900px",
        height: "500px",
        background:
          "linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #40916C 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "40px",
        position: "relative",
      }}
    >
      {/* Gold accent top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #92620A, #C9A227, #E8C55A, #C9A227, #92620A)",
        }}
      />

      {/* Logo + Title */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            background: "#C9A227",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
          }}
        >
          🕌
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              color: "#E8C55A",
              fontSize: "22px",
              fontWeight: "bold",
              letterSpacing: "1px",
            }}
          >
            SEDEKAH.AI
          </span>
          <span
            style={{ color: "#74C69D", fontSize: "12px", letterSpacing: "2px" }}
          >
            AMIL DIGITAL TERPERCAYA
          </span>
        </div>
      </div>

      <div
        style={{
          color: "#D8F3DC",
          fontSize: "14px",
          letterSpacing: "3px",
          marginBottom: "16px",
        }}
      >
        SERTIFIKAT DONASI
      </div>

      {/* Dot separator */}
      <div style={{ color: "#C9A227", fontSize: "20px", marginBottom: "16px" }}>
        ✦ ✦ ✦
      </div>

      {/* Donor Name */}
      <div
        style={{
          color: "#FFFFFF",
          fontSize: "34px",
          fontWeight: "bold",
          marginBottom: "6px",
          textAlign: "center",
        }}
      >
        {donorName}
      </div>
      <div style={{ color: "#74C69D", fontSize: "14px", marginBottom: "20px" }}>
        telah menunaikan {typeLabel}
      </div>

      {/* Amount */}
      <div
        style={{
          background: "rgba(255,255,255,0.12)",
          borderRadius: "16px",
          padding: "16px 40px",
          marginBottom: "16px",
          border: "1px solid rgba(201,162,39,0.4)",
        }}
      >
        <span
          style={{ color: "#E8C55A", fontSize: "36px", fontWeight: "bold" }}
        >
          {amount}
        </span>
      </div>

      {/* Campaign */}
      <div
        style={{
          color: "#D8F3DC",
          fontSize: "14px",
          textAlign: "center",
          maxWidth: "600px",
          marginBottom: "6px",
        }}
      >
        Disalurkan untuk:{" "}
        <span style={{ color: "#FFFFFF", fontWeight: "bold" }}>
          {campaignName}
        </span>
      </div>

      {/* Date */}
      <div style={{ color: "#74C69D", fontSize: "12px", marginBottom: "20px" }}>
        {date}
      </div>

      {/* QS 2:261 */}
      <div
        style={{
          color: "#C9A227",
          fontSize: "12px",
          fontStyle: "italic",
          textAlign: "center",
          maxWidth: "700px",
        }}
      >
        &quot;Perumpamaan orang yang menginfakkan hartanya di jalan Allah
        seperti sebutir biji yang menumbuhkan tujuh tangkai, pada setiap tangkai
        ada seratus biji.&quot; — QS 2:261
      </div>

      {/* Bottom accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "6px",
          background:
            "linear-gradient(90deg, #92620A, #C9A227, #E8C55A, #C9A227, #92620A)",
        }}
      />
    </div>,
    {
      width: 900,
      height: 500,
    },
  );
}
