import { IslamicLoadingSpinner } from "@/components/shared/IslamicLoadingSpinner";

export default function CampaignDetailLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-surface-warm">
      <IslamicLoadingSpinner message="Memuat detail kampanye..." />
    </div>
  );
}
