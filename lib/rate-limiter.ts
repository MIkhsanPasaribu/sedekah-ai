// ============================================================
// Persistent Rate Limiter — DB-backed with in-memory fallback
// ============================================================

import { prisma } from "@/lib/prisma";

/**
 * In-memory fallback when DB is unavailable.
 */
const memoryFallback = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a user is within rate limits.
 * Uses DB-backed storage for persistence across restarts.
 * Falls back to in-memory if DB fails.
 *
 * @returns true if request is allowed, false if rate limited
 */
export async function checkRateLimitPersistent(
  userId: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): Promise<boolean> {
  try {
    return await checkDbRateLimit(userId, maxRequests, windowMs);
  } catch {
    // Fall back to in-memory if DB is unavailable
    return checkMemoryRateLimit(userId, maxRequests, windowMs);
  }
}

async function checkDbRateLimit(
  userId: string,
  maxRequests: number,
  windowMs: number,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMs);

  // Count recent messages from this user within the window
  const recentCount = await prisma.message.count({
    where: {
      conversation: { user: { authId: userId } },
      role: "user",
      createdAt: { gte: windowStart },
    },
  });

  return recentCount < maxRequests;
}

function checkMemoryRateLimit(
  userId: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  const now = Date.now();
  const entry = memoryFallback.get(userId);
  if (!entry || now > entry.resetAt) {
    memoryFallback.set(userId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count += 1;
  return true;
}
