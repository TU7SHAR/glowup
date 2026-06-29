-- ─── FIX: Simplify RLS for analyses table ─────────────────────
-- The old policy used current_setting('app.session_id', true) which requires
-- an RPC call to set the session variable before every query.
-- This simpler approach works with the standard Supabase JS client.

-- Drop the old complex policies
DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Service role can insert analyses" ON public.analyses;
DROP POLICY IF EXISTS "Service role can update analyses" ON public.analyses;

-- New simple policies:
-- 1. Authenticated users can see their own analyses (by user_id)
CREATE POLICY "Authenticated users view own analyses" ON public.analyses
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- 2. Service role handles all inserts/updates (via admin client in API routes)
CREATE POLICY "Service role full access analyses" ON public.analyses
  FOR ALL USING (auth.role() = 'service_role');

-- Note: Anonymous session access is handled by the /api/results route
-- using the admin client (service role), which bypasses RLS.
-- The API validates session_id from the request before returning data.
