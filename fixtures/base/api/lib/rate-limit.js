/**
 * Create a fixed-window rate limiter keyed by client id.
 * @param {{limit?: number, windowMs?: number, now?: () => number}} [options]
 * @returns {(key: string) => {allowed: boolean, remaining: number}}
 */
export function createRateLimiter({ limit = 1000, windowMs = 60_000, now = () => performance.now() } = {}) {
  const buckets = new Map();
  return (key) => {
    const time = now();
    const bucket = buckets.get(key);
    if (!bucket || time - bucket.start >= windowMs) {
      buckets.set(key, { start: time, count: 1 });
      return { allowed: true, remaining: limit - 1 };
    }
    bucket.count += 1;
    return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
  };
}
