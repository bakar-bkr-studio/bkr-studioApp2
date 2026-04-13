import "server-only";

interface RateLimitOptions {
  key: string;
  maxRequests: number;
  windowMs: number;
}

interface RateLimitState {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitState>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit({
  key,
  maxRequests,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const nextState: RateLimitState = {
      count: 1,
      resetAt: now + windowMs,
    };
    rateLimitStore.set(key, nextState);

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetAt: nextState.resetAt,
    };
  }

  if (existing.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  const updated: RateLimitState = {
    count: existing.count + 1,
    resetAt: existing.resetAt,
  };
  rateLimitStore.set(key, updated);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - updated.count),
    resetAt: updated.resetAt,
  };
}
