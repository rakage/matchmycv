import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis instance
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limiters for different operations
export const analysisRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 h"), // 50 analyses per hour (increased from 5)
      analytics: true,
    })
  : null;

export const editRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 h"), // 100 edits per hour (increased from 20)
      analytics: true,
    })
  : null;

export const exportRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 h"), // 30 exports per hour (increased from 10)
      analytics: true,
    })
  : null;

export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "15 m"), // 20 auth attempts per 15 minutes (increased from 10)
      analytics: true,
    })
  : null;

export async function checkRateLimit(
  identifier: string,
  limiter: typeof analysisRateLimit
) {
  if (!limiter) {
    // If no Redis configured, allow all requests in development
    return { success: true, limit: 100, remaining: 99, reset: new Date() };
  }

  const result = await limiter.limit(identifier);
  return result;
}

// Usage tracking helpers
export async function incrementUsage(userId: string, type: string) {
  if (!redis) return;

  const key = `usage:${userId}:${type}:${new Date().toISOString().slice(0, 7)}`; // monthly key
  await redis.incr(key);
  await redis.expire(key, 60 * 60 * 24 * 32); // expire after 32 days
}

export async function getUsage(userId: string, type: string, month?: string) {
  if (!redis) return 0;

  const monthKey = month || new Date().toISOString().slice(0, 7);
  const key = `usage:${userId}:${type}:${monthKey}`;
  const count = await redis.get(key);
  return typeof count === "number" ? count : 0;
}
