export type RateLimitScope = 'user' | 'guild' | 'channel' | 'global';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
  resetAt: number;
}

export class RateLimitService {
  private static windows = new Map<string, { count: number; resetAt: number }>();

  static consume(
    key: string,
    limit: number,
    windowMs: number,
    now = Date.now()
  ): RateLimitResult {
    const entry = this.windows.get(key);

    if (!entry || now >= entry.resetAt) {
      const resetAt = now + windowMs;
      this.windows.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: limit - 1, retryAfterMs: 0, resetAt };
    }

    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: Math.max(0, entry.resetAt - now),
        resetAt: entry.resetAt,
      };
    }

    entry.count += 1;
    this.windows.set(key, entry);

    return {
      allowed: true,
      remaining: Math.max(0, limit - entry.count),
      retryAfterMs: 0,
      resetAt: entry.resetAt,
    };
  }

  static clear(key: string): void {
    this.windows.delete(key);
  }

  static clearExpired(now = Date.now()): void {
    for (const [key, value] of this.windows.entries()) {
      if (now >= value.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}
