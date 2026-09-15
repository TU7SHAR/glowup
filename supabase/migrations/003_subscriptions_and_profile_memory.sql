-- ============================================================
-- Migration 003 — Subscription foundation + profile memory
-- ------------------------------------------------------------
-- Transforms the data model from a one-time-payment product into
-- a recurring-subscription product. This migration is ADDITIVE and
-- backward compatible: it does not remove any existing column or
-- change any existing behavior. Application code is updated in later
-- phases; this migration only puts the schema in place.
--
-- Introduces:
--   1. subscriptions        — the source of truth for access (spec §17)
--   2. payments (widened)    — link payments to subscriptions + new plans/states (spec §43)
--   3. webhook_events        — idempotent webhook processing (spec §19)
--   4. appearance_profiles   — persistent profile memory (spec §13, §24)
--   5. analyses (extended)   — baseline vs. progress analyses + history (spec §14, §44, §45)
--
-- Safe to run more than once (IF NOT EXISTS / idempotent guards).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. SUBSCRIPTIONS TABLE  (spec §17 — centralized source of truth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Provider linkage
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_subscription_id TEXT UNIQUE,      -- Razorpay subscription id (sub_xxx)
  provider_plan_id TEXT,                     -- Razorpay plan id (plan_xxx)

  -- Which GlowUp plan this subscription represents
  --   trial_7d  → ₹199 / 7 days  (acquisition subscription)
  --   pro_monthly → ₹499 / month (primary plan)
  --   pro_annual  → ₹5,499 / year (best value)
  plan TEXT NOT NULL CHECK (plan IN ('trial_7d', 'pro_monthly', 'pro_annual')),

  -- Lifecycle status (spec §17)
  status TEXT NOT NULL DEFAULT 'trialing' CHECK (
    status IN (
      'active',
      'trialing',
      'past_due',
      'canceled',
      'expired',
      'paused',
      'payment_failed'
    )
  ),

  -- Billing period window
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,

  -- Cancellation handling (spec §21)
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Trial window (spec §17)
  trial_start TIMESTAMPTZ,
  trial_end   TIMESTAMPTZ,

  -- Failed-payment grace handling (spec §20)
  grace_period_end TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_sub
  ON public.subscriptions(provider_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);
-- Fast "does this user currently have access?" lookups.
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);

-- A user should have at most one non-terminal subscription at a time.
-- (canceled/expired are terminal and may accumulate as history.)
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscriptions_one_live_per_user
  ON public.subscriptions(user_id)
  WHERE status IN ('active', 'trialing', 'past_due', 'paused', 'payment_failed');

-- ============================================================
-- 2. PAYMENTS TABLE — widen for subscriptions (spec §43, §18)
-- ============================================================
-- Keep storing individual transactions, but link them to a subscription
-- and support recurring plan keys + subscription payment states.

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS subscription_id UUID
    REFERENCES public.subscriptions(id) ON DELETE SET NULL;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT;

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS razorpay_invoice_id TEXT;

-- Distinguish a first authorization charge from a recurring renewal.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS billing_reason TEXT;   -- 'initial' | 'renewal' | 'one_time'

CREATE INDEX IF NOT EXISTS idx_payments_subscription_id
  ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_subscription
  ON public.payments(razorpay_subscription_id);

-- Widen the plan CHECK to allow the new subscription plan keys while
-- preserving the legacy one-time keys (report/coach/monthly) so existing
-- rows and the not-yet-migrated code keep working.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_plan_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_plan_check CHECK (
    plan IN (
      -- legacy one-time keys (retained for backward compatibility)
      'report', 'coach', 'monthly',
      -- new subscription plan keys
      'trial_7d', 'pro_monthly', 'pro_annual'
    )
  );

-- Widen the status CHECK to include recurring lifecycle states.
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_status_check CHECK (
    status IN (
      'created', 'authorized', 'captured', 'failed', 'refunded',
      -- subscription-oriented states
      'pending', 'paid'
    )
  );

-- ============================================================
-- 3. WEBHOOK EVENTS TABLE — idempotency ledger (spec §19)
-- ============================================================
-- Every provider webhook event is recorded exactly once. Processing
-- code inserts the event id first; a duplicate delivery hits the unique
-- constraint and is safely ignored.
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'razorpay',

  -- Provider-supplied identifiers used as idempotency keys.
  provider_event_id TEXT,          -- x-razorpay-event-id header
  event_type TEXT NOT NULL,        -- e.g. subscription.charged
  provider_payment_id TEXT,
  provider_subscription_id TEXT,

  status TEXT NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'processed', 'failed', 'ignored')),
  error_message TEXT,
  payload JSONB DEFAULT '{}'::jsonb,

  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- The primary idempotency key: a given provider event id is processed once.
CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_events_provider_event
  ON public.webhook_events(provider, provider_event_id)
  WHERE provider_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_events_type
  ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_subscription
  ON public.webhook_events(provider_subscription_id);

-- ============================================================
-- 4. APPEARANCE PROFILES — persistent profile memory (spec §13, §24)
-- ============================================================
-- Structured, cacheable representation of a user's appearance so that
-- downstream interactions can use cheaper text models instead of
-- re-running expensive vision analysis every time (spec §23–§25).
CREATE TABLE IF NOT EXISTS public.appearance_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  session_id TEXT,   -- allows a profile to exist for an anonymous user pre-signup

  -- The analysis that established / last updated this profile.
  baseline_analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  latest_analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL,

  -- Cached structured visual analysis (spec §24)
  --   { face_shape, skin_type, undertone, hair_profile, beard_profile,
  --     style_profile, goal, recommendations, ... }
  profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Evolving personalization memory (spec §13)
  goals JSONB DEFAULT '[]'::jsonb,                  -- current + prior goals
  completed_recommendations JSONB DEFAULT '[]'::jsonb,
  selected_products JSONB DEFAULT '[]'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Monotonic version so we can tell how much the profile has evolved.
  version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appearance_profiles_user
  ON public.appearance_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_appearance_profiles_session
  ON public.appearance_profiles(session_id);

-- ============================================================
-- 5. ANALYSES — baseline vs. progress + history threading (spec §14, §44, §45)
-- ============================================================
-- An analysis becomes part of an ongoing history rather than a one-shot report.
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS analysis_type TEXT NOT NULL DEFAULT 'baseline'
    CHECK (analysis_type IN ('baseline', 'progress', 'style_update'));

-- Progress/update analyses point back to the baseline they build on.
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS parent_analysis_id UUID
    REFERENCES public.analyses(id) ON DELETE SET NULL;

-- Retry accounting for the async/retry pipeline built in a later phase (spec §35).
ALTER TABLE public.analyses
  ADD COLUMN IF NOT EXISTS retry_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_analyses_parent
  ON public.analyses(parent_analysis_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_created
  ON public.analyses(user_id, created_at DESC);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.subscriptions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appearance_profiles  ENABLE ROW LEVEL SECURITY;

-- Subscriptions: a user may read their own; service role manages all.
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.subscriptions;
CREATE POLICY "Service role manages subscriptions" ON public.subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- Webhook events: service role only (never exposed to clients).
DROP POLICY IF EXISTS "Service role manages webhook events" ON public.webhook_events;
CREATE POLICY "Service role manages webhook events" ON public.webhook_events
  FOR ALL USING (auth.role() = 'service_role');

-- Appearance profiles: a user may read their own; service role manages all.
DROP POLICY IF EXISTS "Users can view own appearance profile" ON public.appearance_profiles;
CREATE POLICY "Users can view own appearance profile" ON public.appearance_profiles
  FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Service role manages appearance profiles" ON public.appearance_profiles;
CREATE POLICY "Service role manages appearance profiles" ON public.appearance_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 7. updated_at TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_appearance_profiles_updated_at ON public.appearance_profiles;
CREATE TRIGGER trg_appearance_profiles_updated_at
  BEFORE UPDATE ON public.appearance_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 8. ENTITLEMENT HELPER (spec §22 — access from subscription state)
-- ============================================================
-- Returns the highest-value plan a user currently has access to, or NULL.
-- Access is granted while a subscription is active/trialing, or while it is
-- canceled/past_due/payment_failed but still inside its paid/grace window.
CREATE OR REPLACE FUNCTION public.user_active_plan(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_plan TEXT;
BEGIN
  SELECT plan INTO v_plan
  FROM public.subscriptions
  WHERE user_id = p_user_id
    AND (
      status IN ('active', 'trialing')
      OR (
        status IN ('canceled', 'past_due', 'payment_failed')
        AND COALESCE(grace_period_end, current_period_end) > NOW()
      )
    )
  ORDER BY
    CASE plan
      WHEN 'pro_annual' THEN 3
      WHEN 'pro_monthly' THEN 2
      WHEN 'trial_7d' THEN 1
      ELSE 0
    END DESC,
    current_period_end DESC NULLS LAST
  LIMIT 1;

  RETURN v_plan;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
