import { IslamicLoadingSpinner } from "@/components/shared/IslamicLoadingSpinner";

export default function DonationImpactLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface-warm">
      <IslamicLoadingSpinner message="Memuat laporan dampak donasi Anda..." />
    </div>
  );
}
