// In-memory sliding-window rate limiter for voting anti-abuse

interface RateLimitRecord {
  timestamps: number[];
}

const windowMap = new Map<string, RateLimitRecord>();

// Default: 5 votes per hour (3600 seconds)
export function checkRateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 3600
): { allowed: boolean; remaining: number; resetInSeconds: number } {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = windowMap.get(key);
  if (!record) {
    record = { timestamps: [] };
    windowMap.set(key, record);
  }

  // Filter timestamps within sliding window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetInSeconds = Math.ceil((oldest + windowMs - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.max(resetInSeconds, 1)
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: limit - record.timestamps.length,
    resetInSeconds: windowSeconds
  };
}

// Cleanup stale keys periodically
setInterval(() => {
  const now = Date.now();
  const cutoff = now - 3600 * 1000;
  for (const [key, record] of windowMap.entries()) {
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
    if (record.timestamps.length === 0) {
      windowMap.delete(key);
    }
  }
}, 60000);
