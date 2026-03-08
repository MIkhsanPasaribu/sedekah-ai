import { DzikirLoader } from "@/components/shared/LoadingSpinner";

export default function CampaignsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-warm">
      <DzikirLoader />
    </div>
  );
}
