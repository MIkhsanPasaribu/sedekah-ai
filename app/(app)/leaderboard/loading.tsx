export default function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8 text-center space-y-3">
          <div className="h-10 w-10 mx-auto animate-pulse rounded-full bg-ink-ghost" />
          <div className="h-8 w-56 mx-auto animate-pulse rounded bg-ink-ghost" />
          <div className="h-4 w-80 mx-auto animate-pulse rounded bg-ink-ghost" />
          <div className="h-16 w-72 mx-auto animate-pulse rounded-2xl bg-ink-ghost" />
        </div>

        {/* Rows skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-ink-ghost bg-surface-white px-5 py-4"
            >
              <div className="h-8 w-8 animate-pulse rounded-full bg-ink-ghost" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-ink-ghost" />
                <div className="h-3 w-24 animate-pulse rounded bg-ink-ghost" />
              </div>
              <div className="h-5 w-24 animate-pulse rounded bg-ink-ghost" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
