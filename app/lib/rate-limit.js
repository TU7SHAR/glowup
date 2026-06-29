/**
 * Rate Limiting — Production Grade
 *
 * Strategy (in priority order):
 * 1. Upstash Redis (if UPSTASH_REDIS_REST_URL is set) — <5ms latency
 * 2. Supabase table (if rate_limits table exists) — ~50-200ms latency
 * 3. Fail open (allow request) — if neither is configured
 *
 * To use Upstash (recommended for production):
 *   npm install @upstash/ratelimit @upstash/redis
 *   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local
 *   Free tier: 10,000 requests/day — more than enough for MVP
 *
 * To use Supabase (current default, good for <100 users):
 *   Run supabase/migrations/001_rate_limits.sql
 */

import { createAdminClient } from "@/app/lib/supabase/server";

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(identifier, action, maxRequests = 5, windowSeconds = 300) {
  // ─── STRATEGY 1: Upstash Redis (fast, production-ready) ──────
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return checkRateLimitUpstash(identifier, action, maxRequests, windowSeconds);
  }

  // ─── STRATEGY 2: Supabase table (slower, but works) ──────────
  return checkRateLimitSupabase(identifier, action, maxRequests, windowSeconds);
}

/**
 * Upstash Redis rate limiting (single-digit ms latency)
 * Uses sliding window algorithm
 */
async function checkRateLimitUpstash(identifier, action, maxRequests, windowSeconds) {
  try {
    // Use plain fetch to Upstash REST API — no npm packages needed
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    const key = `glowup:${action}:${identifier}`;
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // MULTI: Remove old entries + add current + count
    const pipeline = [
      ["ZREMRANGEBYSCORE", key, "0", String(now - windowMs)],
      ["ZADD", key, String(now), `${now}:${Math.random()}`],
      ["ZCARD", key],
      ["EXPIRE", key, String(windowSeconds + 10)],
    ];

    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipeline),
      signal: AbortSignal.timeout(3000), // 3s max for rate limit check
    });

    if (!response.ok) throw new Error(`Upstash HTTP ${response.status}`);

    const results = await response.json();
    const count = results[2]?.result || 0;

    if (count > maxRequests) {
      return { allowed: false, remaining: 0, retryAfter: windowSeconds };
    }

    return { allowed: true, remaining: Math.max(0, maxRequests - count) };
  } catch (error) {
    console.warn("[RateLimit] Upstash failed, failing open:", error.message);
    return { allowed: true, remaining: maxRequests };
  }
}

/**
 * Supabase-backed rate limiting (50-200ms latency)
 * Good enough for MVP, swap to Upstash when you notice latency
 */
async function checkRateLimitSupabase(identifier, action, maxRequests, windowSeconds) {
  try {
    const supabase = createAdminClient();
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const key = `${action}:${identifier}`;

    // Count requests in window
    const { count, error } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", windowStart);

    if (error) {
      // Table doesn't exist yet — fail open
      console.warn("[RateLimit] Supabase query failed:", error.message);
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const requestCount = count || 0;

    if (requestCount >= maxRequests) {
      return { allowed: false, remaining: 0, retryAfter: windowSeconds };
    }

    // Record this request (fire and forget — don't block response)
    supabase.from("rate_limits").insert({ key, created_at: new Date().toISOString() }).then(() => {});

    // Async cleanup of old entries
    supabase.from("rate_limits").delete().lt("created_at", windowStart).then(() => {});

    return { allowed: true, remaining: maxRequests - requestCount - 1 };
  } catch (e) {
    console.error("[RateLimit] Error:", e.message);
    return { allowed: true, remaining: maxRequests };
  }
}
