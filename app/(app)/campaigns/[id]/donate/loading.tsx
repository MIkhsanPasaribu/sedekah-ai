export default function DonateLoading() {
  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb skeleton */}
        <div className="mb-6 flex items-center gap-2">
          <div className="h-4 w-20 animate-pulse rounded bg-ink-ghost" />
          <div className="h-4 w-2 animate-pulse rounded bg-ink-ghost" />
          <div className="h-4 w-32 animate-pulse rounded bg-ink-ghost" />
        </div>

        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-ink-ghost" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-ink-ghost" />
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Campaign summary skeleton */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-ink-ghost bg-surface-white p-5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-ink-ghost mb-2" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-ink-ghost mb-5" />
              <div className="h-2 w-full animate-pulse rounded-full bg-ink-ghost mb-3" />
              <div className="h-6 w-2/3 animate-pulse rounded bg-ink-ghost" />
            </div>
          </div>

          {/* Form skeleton */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-ink-ghost bg-surface-white p-6 space-y-5">
              <div className="h-5 w-32 animate-pulse rounded bg-ink-ghost" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 animate-pulse rounded-xl bg-ink-ghost"
                  />
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-10 animate-pulse rounded-xl bg-ink-ghost" />
                <div className="h-10 animate-pulse rounded-xl bg-ink-ghost" />
              </div>
              <div className="h-20 animate-pulse rounded-xl bg-ink-ghost" />
              <div className="h-12 animate-pulse rounded-xl bg-ink-ghost" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
