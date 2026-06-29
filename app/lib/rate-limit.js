/**
 * Serverless-safe Rate Limiting using Supabase
 *
 * FIX: The old in-memory Map resets on every serverless cold start.
 * This uses Supabase as a shared state store so rate limits
 * persist across all serverless instances.
 *
 * For higher scale, swap this for Upstash Redis (@upstash/ratelimit).
 */

import { createAdminClient } from "@/app/lib/supabase/server";

/**
 * Check rate limit for a given key
 * @param {string} identifier - IP address or user ID
 * @param {string} action - Action being rate limited (e.g., "analyze", "payment")
 * @param {number} maxRequests - Max requests allowed in the window
 * @param {number} windowSeconds - Time window in seconds
 * @returns {{ allowed: boolean, remaining: number, retryAfter?: number }}
 */
export async function checkRateLimit(identifier, action, maxRequests = 5, windowSeconds = 300) {
  try {
    const supabase = createAdminClient();
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const key = `${action}:${identifier}`;

    // Count requests in the current window
    const { count, error } = await supabase
      .from("rate_limits")
      .select("*", { count: "exact", head: true })
      .eq("key", key)
      .gte("created_at", windowStart);

    if (error) {
      // If rate limit table doesn't exist yet, allow the request
      console.warn("[RateLimit] Query failed (table may not exist):", error.message);
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const requestCount = count || 0;

    if (requestCount >= maxRequests) {
      // Calculate retry-after
      const { data: oldest } = await supabase
        .from("rate_limits")
        .select("created_at")
        .eq("key", key)
        .gte("created_at", windowStart)
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      const retryAfter = oldest
        ? Math.ceil((new Date(oldest.created_at).getTime() + windowSeconds * 1000 - Date.now()) / 1000)
        : windowSeconds;

      return { allowed: false, remaining: 0, retryAfter: Math.max(retryAfter, 1) };
    }

    // Record this request
    await supabase.from("rate_limits").insert({ key, created_at: new Date().toISOString() });

    // Cleanup old entries (async, don't block)
    supabase
      .from("rate_limits")
      .delete()
      .lt("created_at", windowStart)
      .then(() => {});

    return { allowed: true, remaining: maxRequests - requestCount - 1 };
  } catch (e) {
    // Fail open — if rate limit check fails, allow the request
    console.error("[RateLimit] Error:", e.message);
    return { allowed: true, remaining: maxRequests };
  }
}
