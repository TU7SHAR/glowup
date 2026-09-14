/**
 * ═══════════════════════════════════════════════════════════
 * GlowUp AI — Subscription server helpers (Phase 2)
 * ═══════════════════════════════════════════════════════════
 *
 * Centralized logic for translating Razorpay subscription state into our
 * `subscriptions` table, which is the source of truth for access (spec §17).
 *
 * These helpers are used by the payment routes and the webhook handler so
 * that subscription state transitions live in ONE place and are applied
 * consistently and idempotently.
 *
 * All functions take an already-constructed admin Supabase client so the
 * caller controls the connection (and so this module has no side effects on
 * import).
 */

import Razorpay from "razorpay";
import { getPlan } from "./plans";

/**
 * Map a Razorpay subscription status → our internal status enum.
 * Razorpay statuses: created, authenticated, active, pending, halted,
 *                    cancelled, completed, expired, paused
 * Our enum: active, trialing, past_due, canceled, expired, paused, payment_failed
 */
export function mapRazorpaySubscriptionStatus(razorpayStatus) {
  switch (razorpayStatus) {
    case "active":
      return "active";
    case "authenticated":
    case "created":
      // Authorized but not yet charged — treat as trialing until first charge.
      return "trialing";
    case "pending":
      // A charge failed and Razorpay is retrying.
      return "past_due";
    case "halted":
      // Retries exhausted.
      return "payment_failed";
    case "paused":
      return "paused";
    case "cancelled":
      return "canceled";
    case "completed":
    case "expired":
      return "expired";
    default:
      return "trialing";
  }
}

/** Construct a Razorpay SDK client from env. Throws if keys are missing. */
export function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

/** Resolve the configured Razorpay Plan ID for one of our plan keys. */
export function getRazorpayPlanId(planKey) {
  const plan = getPlan(planKey);
  if (!plan) return null;
  return process.env[plan.razorpayPlanIdEnv] || null;
}

/** Convert a Razorpay epoch-seconds timestamp to an ISO string (or null). */
export function epochToIso(epochSeconds) {
  if (!epochSeconds) return null;
  return new Date(epochSeconds * 1000).toISOString();
}

/**
 * Insert or update the local subscription row that mirrors a Razorpay
 * subscription. Keyed on `provider_subscription_id` so repeated webhook
 * deliveries converge to the same row (idempotent).
 *
 * @returns {Promise<{subscription?: object, error?: any}>}
 */
export async function upsertSubscriptionFromRazorpay(supabase, {
  userId,
  planKey,
  razorpaySubscription,
}) {
  const sub = razorpaySubscription;
  const status = mapRazorpaySubscriptionStatus(sub.status);

  const row = {
    provider: "razorpay",
    provider_subscription_id: sub.id,
    provider_plan_id: sub.plan_id || getRazorpayPlanId(planKey),
    plan: planKey,
    status,
    current_period_start: epochToIso(sub.current_start),
    current_period_end: epochToIso(sub.current_end),
    cancel_at_period_end: !!sub.cancel_at_cycle_end,
    canceled_at:
      status === "canceled" ? epochToIso(sub.ended_at) || new Date().toISOString() : null,
    trial_start: epochToIso(sub.start_at),
    trial_end: epochToIso(sub.charge_at),
    updated_at: new Date().toISOString(),
  };

  // userId is required for a new row; on updates we keep the existing owner.
  if (userId) row.user_id = userId;

  const { data, error } = await supabase
    .from("subscriptions")
    .upsert(row, { onConflict: "provider_subscription_id" })
    .select("*")
    .single();

  return { subscription: data, error };
}

/**
 * Apply a status change to an existing subscription identified by its
 * Razorpay subscription id. Used by webhook lifecycle events. No-op (returns
 * notFound) if we have no local row for that subscription yet.
 */
export async function updateSubscriptionStatus(supabase, {
  providerSubscriptionId,
  status,
  extra = {},
}) {
  const patch = { status, updated_at: new Date().toISOString(), ...extra };
  const { data, error } = await supabase
    .from("subscriptions")
    .update(patch)
    .eq("provider_subscription_id", providerSubscriptionId)
    .select("*")
    .maybeSingle();

  if (error) return { error };
  if (!data) return { notFound: true };
  return { subscription: data };
}

/**
 * Record a payment tied to a subscription (initial authorization or renewal).
 * Idempotent on razorpay_payment_id via upsert.
 */
export async function recordSubscriptionPayment(supabase, {
  userId,
  subscriptionId,
  planKey,
  razorpayPaymentId,
  razorpaySubscriptionId,
  razorpayInvoiceId,
  amount,
  status = "paid",
  billingReason = "renewal",
}) {
  const row = {
    user_id: userId || null,
    subscription_id: subscriptionId || null,
    plan: planKey,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_subscription_id: razorpaySubscriptionId,
    razorpay_invoice_id: razorpayInvoiceId || null,
    amount: amount ?? getPlan(planKey)?.amount ?? 0,
    currency: "INR",
    status,
    billing_reason: billingReason,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("payments")
    .upsert(row, { onConflict: "razorpay_payment_id" })
    .select("*")
    .maybeSingle();

  return { payment: data, error };
}

/**
 * Idempotency guard for webhooks (spec §19). Records the event by its
 * provider event id. Returns { duplicate: true } if we've already seen it.
 *
 * @returns {Promise<{eventRow?: object, duplicate?: boolean, error?: any}>}
 */
export async function claimWebhookEvent(supabase, {
  providerEventId,
  eventType,
  providerPaymentId,
  providerSubscriptionId,
  payload,
}) {
  // If Razorpay didn't send an event id header, we can't dedupe on it; record
  // anyway (without the unique key) so we still have an audit trail.
  const insert = {
    provider: "razorpay",
    provider_event_id: providerEventId || null,
    event_type: eventType,
    provider_payment_id: providerPaymentId || null,
    provider_subscription_id: providerSubscriptionId || null,
    status: "received",
    payload: payload || {},
  };

  const { data, error } = await supabase
    .from("webhook_events")
    .insert(insert)
    .select("*")
    .single();

  if (error) {
    // Unique violation on (provider, provider_event_id) → already processed.
    if (error.code === "23505") {
      return { duplicate: true };
    }
    return { error };
  }
  return { eventRow: data };
}

/** Mark a previously claimed webhook event as processed / failed. */
export async function finalizeWebhookEvent(supabase, eventId, status, errorMessage) {
  if (!eventId) return;
  await supabase
    .from("webhook_events")
    .update({
      status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}
