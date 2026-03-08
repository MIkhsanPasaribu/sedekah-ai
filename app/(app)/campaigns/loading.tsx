export default function CampaignsLoading() {
  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse rounded-lg bg-ink-ghost" />
            <div className="mt-2 h-4 w-72 animate-pulse rounded-lg bg-ink-ghost/60" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-xl bg-ink-ghost" />
        </div>

        {/* Filter skeleton */}
        <div className="mb-6 flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-20 animate-pulse rounded-full bg-ink-ghost"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>

        {/* Card grid skeleton */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-ink-ghost bg-white shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="h-40 w-full animate-pulse bg-ink-ghost/40" />
              <div className="p-4">
                <div className="h-4 w-3/4 animate-pulse rounded bg-ink-ghost" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-ink-ghost/60" />
                <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-ink-ghost/60" />
                <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-ink-ghost/40" />
                <div className="mt-3 flex items-center justify-between">
                  <div className="h-3 w-20 animate-pulse rounded bg-ink-ghost/60" />
                  <div className="h-6 w-16 animate-pulse rounded-full bg-ink-ghost/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
