export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-surface-warm">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-ink-ghost" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-ink-ghost/60" />
        </div>

        {/* Stats row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-ink-ghost bg-white p-5 shadow-sm"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="h-4 w-24 animate-pulse rounded bg-ink-ghost/60" />
              <div className="mt-3 h-7 w-32 animate-pulse rounded bg-ink-ghost" />
              <div className="mt-1 h-3 w-20 animate-pulse rounded bg-ink-ghost/60" />
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-ink-ghost bg-white shadow-sm"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>

        {/* Milestones */}
        <div className="mt-6 h-36 animate-pulse rounded-2xl border border-ink-ghost bg-white shadow-sm" />

        {/* History */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-ink-ghost bg-white shadow-sm">
          <div className="border-b border-ink-ghost px-6 py-4">
            <div className="h-5 w-32 animate-pulse rounded bg-ink-ghost" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-ink-ghost/50 px-6 py-4"
            >
              <div className="h-8 w-8 animate-pulse rounded-full bg-ink-ghost/60" />
              <div className="flex-1">
                <div className="h-4 w-40 animate-pulse rounded bg-ink-ghost" />
                <div className="mt-1 h-3 w-28 animate-pulse rounded bg-ink-ghost/60" />
              </div>
              <div className="h-5 w-20 animate-pulse rounded-full bg-ink-ghost/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
