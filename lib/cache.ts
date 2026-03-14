// ============================================================
// In-Memory TTL Cache — Lightweight caching utility
// ============================================================
// Used by agent nodes to avoid redundant DB queries per request.
// Simple Map-based approach with configurable TTL (no Redis needed).

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class TtlCache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: number;

  /**
   * @param ttlMs Time-to-live in milliseconds. Default: 5 minutes.
   */
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  /** Get a value from cache if it exists and hasn't expired */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /** Set a value in the cache with the configured TTL */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /** Check if a key exists and hasn't expired */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /** Remove a specific key */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /** Clear all entries */
  clear(): void {
    this.cache.clear();
  }
}

// ── Singleton campaign cache (5-minute TTL) ──────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const campaignCache = new TtlCache<any[]>(5 * 60 * 1000);
