"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { DirectDonationModal } from "@/components/campaigns/DirectDonationModal";

interface CampaignCTAProps {
  campaignId: string;
  campaignName: string;
}

export function CampaignCTA({ campaignId, campaignName }: CampaignCTAProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-3 mt-5">
        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full rounded-xl bg-brand-green-deep py-3 text-sm font-bold text-white transition-colors hover:bg-brand-green-mid"
        >
          💚 Donasi Langsung
        </button>

        {/* Secondary CTA */}
        <Link
          href="/chat"
          className={buttonVariants({
            variant: "outline",
            className: "w-full rounded-xl py-3 text-sm font-bold",
          })}
        >
          🤖 Analisis via AI
        </Link>

        {/* Tertiary link */}
        <p className="text-center text-xs text-ink-mid">
          Ingin mengisi form lengkap?{" "}
          <Link
            href={`/campaigns/${campaignId}/donate`}
            className="font-medium text-brand-green-deep underline underline-offset-2 hover:text-brand-green-mid"
          >
            Buka halaman donasi →
          </Link>
        </p>
      </div>

      <DirectDonationModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        campaignId={campaignId}
        campaignName={campaignName}
      />
    </>
  );
}
