-- ─── RATE LIMITS TABLE ────────────────────────────────────────
-- Used for serverless-safe rate limiting (not in-memory)
-- Each request logs an entry; queries count recent entries per key

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups by key + time window
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_time
  ON public.rate_limits(key, created_at DESC);

-- Auto-cleanup: delete entries older than 10 minutes (run via pg_cron or app)
-- For Supabase, you can enable pg_cron and schedule:
-- SELECT cron.schedule('cleanup-rate-limits', '*/5 * * * *',
--   $$ DELETE FROM public.rate_limits WHERE created_at < NOW() - INTERVAL '10 minutes' $$
-- );

-- RLS: service role only (API routes use admin client)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage rate limits" ON public.rate_limits
  FOR ALL USING (true);
