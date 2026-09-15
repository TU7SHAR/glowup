# GlowUp AI — Subscription Transformation

Living design doc for converting GlowUp from a **one-time AI report** product
into a **recurring subscription transformation coach**. Updated on every phase.

---

## New business model (target)

| Plan key      | Name           | Price   | Billing        | Positioning        |
| ------------- | -------------- | ------- | -------------- | ------------------ |
| `trial_7d`    | 7-Day Glow-Up  | ₹199    | every 7 days   | Acquisition trial  |
| `pro_monthly` | GlowUp Pro     | ₹499    | monthly        | Primary (POPULAR)  |
| `pro_annual`  | GlowUp Annual  | ₹5,499  | yearly         | Best value         |

The report is no longer the product — it is the **baseline** that starts an
ongoing transformation relationship (analysis → actions → progress → re-analysis
→ upgrade → retention).

---

## Phased delivery (one PR per phase)

1. **Data model foundation** ✅ — schema for subscriptions, profile
   memory, webhook idempotency, analysis history. No behavior change.
2. **Recurring billing backend** ✅ *(this PR)* — Razorpay Subscriptions API +
   subscription webhook lifecycle events + idempotent processing.
3. **Centralized access control** — entitlement from subscription state; remove
   `?unlocked=true` as an auth path; grace period + cancel-at-period-end.
4. **Pricing + copy transformation** — 3 new plans, honest recurring disclosure,
   remove fake social proof, subscription-aware checkout.
5. **Dashboard + transformation loop** — profile memory, re-analysis, daily
   actions, history, streaks.
6. **AI cost architecture** — layered vision/text, cache appearance profile.
7. **Reliability** — async analysis, retries, monitoring hooks.
8. **Trust** — age gate, privacy/medical-safety copy, retention notifications.

---

## Phase 1 — Data model foundation (this PR)

**Migration:** `supabase/migrations/003_subscriptions_and_profile_memory.sql`
(also folded into canonical `supabase/schema.sql`). Fully additive & idempotent —
no existing column removed, no behavior changed.

### New tables

- **`subscriptions`** — the source of truth for access (spec §17). Fields:
  `provider`, `provider_subscription_id`, `provider_plan_id`, `plan`
  (`trial_7d`/`pro_monthly`/`pro_annual`), `status`
  (`active`/`trialing`/`past_due`/`canceled`/`expired`/`paused`/`payment_failed`),
  `current_period_start/end`, `cancel_at_period_end`, `canceled_at`,
  `trial_start/end`, `grace_period_end`, timestamps. A partial unique index
  enforces at most one live subscription per user.
- **`webhook_events`** — idempotency ledger (spec §19). Unique on
  `(provider, provider_event_id)` so duplicate deliveries are ignored.
- **`appearance_profiles`** — persistent profile memory (spec §13, §24). Caches
  structured visual analysis (`profile_data`) plus evolving `goals`,
  `completed_recommendations`, `selected_products`, `preferences`, and a
  monotonic `version`, so later interactions can use cheaper models.

### Extended tables

- **`payments`** — added `subscription_id` (FK), `razorpay_subscription_id`,
  `razorpay_invoice_id`, `billing_reason`. Widened `plan` and `status` CHECKs to
  include subscription plan keys/states while **keeping** the legacy
  `report`/`coach`/`monthly` and one-time states for backward compatibility.
- **`analyses`** — added `analysis_type` (`baseline`/`progress`/`style_update`),
  `parent_analysis_id` (history threading), `retry_count` (for the future async
  retry pipeline).

### Helper

- **`user_active_plan(user_id)`** SQL function — returns the highest-tier plan a
  user currently has access to (active/trialing, or canceled/past_due within the
  paid/grace window), or NULL. This is the seam Phase 3 access control uses.

### App code

- **`app/lib/plans.js`** — single source of truth for plan keys, amounts (paise),
  intervals, labels, CTAs, features, `formatINR()`, and `LEGACY_PLAN_MAP`. Later
  phases import from here instead of hardcoding prices.

### Not in this PR (by design)

No Razorpay subscription calls, no access-control changes, no UI/copy changes.
Those are Phases 2–4.

---

## Phase 2 — Recurring billing backend (this PR)

Replaces one-time Razorpay **Orders** with proper recurring **Subscriptions**,
and makes webhook processing the authoritative, idempotent source of
subscription state (spec §18, §19).

### New / changed

- **`app/lib/subscriptions.js`** (new) — centralized subscription logic:
  Razorpay client + plan-id resolution, `mapRazorpaySubscriptionStatus()`
  (Razorpay → our enum), `upsertSubscriptionFromRazorpay()`,
  `updateSubscriptionStatus()`, `recordSubscriptionPayment()`, and the
  idempotency helpers `claimWebhookEvent()` / `finalizeWebhookEvent()`.
- **`scripts/create-razorpay-plans.mjs`** (new) — one-time script that creates
  the three Razorpay Plans and prints the `RAZORPAY_PLAN_ID_*` values.
- **`app/api/payment/create`** — now creates a Razorpay **Subscription**
  (requires an authenticated user), mirrors it into the `subscriptions` table,
  and returns `subscriptionId` for Checkout. (Was: one-time order.)
- **`app/api/payment/verify`** — verifies the **subscription** signature
  (`payment_id|subscription_id`, timing-safe), confirms ownership, marks the
  local subscription, records the initial payment, and sends a receipt.
- **`app/api/webhook/razorpay`** — idempotent via the `webhook_events` ledger
  (keyed on the `x-razorpay-event-id` header); handles the subscription
  lifecycle (`authenticated`/`activated`/`charged`/`pending`/`halted`/`paused`/
  `resumed`/`cancelled`/`completed`/`updated`), opens a grace window on failed
  charges (spec §20), records renewal payments, and still handles legacy
  order/refund events for backward compatibility. Uses `RAZORPAY_WEBHOOK_SECRET`
  (falls back to `RAZORPAY_KEY_SECRET`).
- **`app/premium/page.js`** — checkout JS switched to the subscription flow
  (login-before-subscribe, `subscription_id`, subscription verify fields). Full
  copy/plan overhaul is Phase 4.
- **`app/lib/email.js`** — payment-confirmation receipt now recognizes the new
  plan keys.
- **`.env.example`** — documents `RAZORPAY_WEBHOOK_SECRET` and the three
  `RAZORPAY_PLAN_ID_*` vars.

### Not in this PR (by design)

Access control still reads the old "any captured payment" logic in
`/api/results` — Phase 3 switches it to subscription entitlement. Pricing UI
copy and the 3-plan checkout layout are Phase 4.

## Migration / ops notes

- Run `003_subscriptions_and_profile_memory.sql` in the Supabase SQL editor (or
  via the migration pipeline) before deploying Phase 2.
- Razorpay **Subscriptions require pre-created Plan IDs**. Phase 2 will add a
  script to create them; the env var names are already reserved in `plans.js`
  (`RAZORPAY_PLAN_ID_TRIAL_7D`, `RAZORPAY_PLAN_ID_PRO_MONTHLY`,
  `RAZORPAY_PLAN_ID_PRO_ANNUAL`).
- Subscriptions attach to a **user account**, so Phase 2/4 will require auth at
  checkout (replacing the current anonymous-pay-then-link flow).
