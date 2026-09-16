/**
 * ═══════════════════════════════════════════════════════════
 * GlowUp AI — Subscription plan definitions (single source of truth)
 * ═══════════════════════════════════════════════════════════
 *
 * Every part of the product (pricing UI, checkout, payment API, webhook
 * handling, emails, access control) should import plan facts from HERE
 * rather than hardcoding amounts or interval labels. This eliminates the
 * price/label duplication that previously lived across Pricing.js,
 * premium/page.js, UpsellSection.js, results/page.js and payment/create.
 *
 * The new model is a recurring-subscription business (spec §1):
 *   trial_7d    → ₹199   billed every 7 days   (acquisition subscription)
 *   pro_monthly → ₹499   billed monthly         (primary plan, "MOST POPULAR")
 *   pro_annual  → ₹5,499 billed yearly          ("BEST VALUE")
 *
 * NOTE: This module only DEFINES the plans. Wiring them into Razorpay
 * subscriptions, checkout and access control happens in later phases.
 * Amounts are in paise (the INR smallest unit) to match Razorpay + the
 * existing `payments.amount` column.
 */

/** Canonical plan keys. These match the `subscriptions.plan` DB CHECK. */
export const PLAN_KEYS = {
  TRIAL_7D: "trial_7d",
  PRO_MONTHLY: "pro_monthly",
  PRO_ANNUAL: "pro_annual",
};

/**
 * Full plan catalog. `amount` is in paise. `interval` / `intervalCount`
 * describe the Razorpay billing period. `razorpayPlanIdEnv` names the env
 * var that will hold the pre-created Razorpay Plan ID (created in a later
 * phase; Razorpay subscriptions require a Plan created up front).
 */
export const PLANS = {
  [PLAN_KEYS.TRIAL_7D]: {
    key: PLAN_KEYS.TRIAL_7D,
    name: "7-Day Glow-Up",
    tagline: "Start your transformation",
    amount: 19900, // ₹199
    anchorAmount: 49900, // ₹499 crossed out (feels like a steal)
    savingsLabel: "60% OFF",
    currency: "INR",
    interval: "weekly",
    intervalCount: 1, // every 7 days
    intervalLabel: "every 7 days",
    shortIntervalLabel: "/ 7 days",
    cta: "Start 7-Day Glow-Up",
    razorpayPlanIdEnv: "RAZORPAY_PLAN_ID_TRIAL_7D",
    tier: 1,
    features: [
      "Full AI analysis",
      "Personalized transformation plan",
      "Grooming recommendations",
      "Style recommendations",
      "30-day plan",
      "Progress tracking",
    ],
  },

  [PLAN_KEYS.PRO_MONTHLY]: {
    key: PLAN_KEYS.PRO_MONTHLY,
    name: "GlowUp Pro",
    tagline: "Your ongoing AI transformation coach",
    amount: 49900, // ₹499
    anchorAmount: 149900, // ₹1,499 crossed out
    savingsLabel: "67% OFF",
    currency: "INR",
    interval: "monthly",
    intervalCount: 1,
    intervalLabel: "per month",
    shortIntervalLabel: "/ month",
    cta: "Start Pro",
    badge: "MOST POPULAR",
    razorpayPlanIdEnv: "RAZORPAY_PLAN_ID_PRO_MONTHLY",
    tier: 2,
    features: [
      "Everything in 7-Day Glow-Up",
      "Ongoing AI coaching",
      "Repeat analyses",
      "Progress comparison",
      "Personalized updates",
      "Transformation history",
      "New recommendations as you improve",
    ],
  },

  [PLAN_KEYS.PRO_ANNUAL]: {
    key: PLAN_KEYS.PRO_ANNUAL,
    name: "GlowUp Annual",
    tagline: "Best value for long-term transformation",
    amount: 549900, // ₹5,499
    anchorAmount: 999900, // ₹9,999 crossed out
    savingsLabel: "45% OFF",
    // Effective monthly rate + honest comparison vs paying monthly.
    effectiveMonthly: 45825, // ₹5,499 / 12 ≈ ₹458/mo
    vsMonthlyNote: "₹458/mo · save ₹489 vs monthly",
    currency: "INR",
    interval: "yearly",
    intervalCount: 1,
    intervalLabel: "per year",
    shortIntervalLabel: "/ year",
    cta: "Go Annual",
    badge: "BEST VALUE",
    razorpayPlanIdEnv: "RAZORPAY_PLAN_ID_PRO_ANNUAL",
    tier: 3,
    features: [
      "Everything in Pro",
      "Long-term transformation tracking",
      "Annual access",
      "New features included",
    ],
  },
};

/** Ordered list (ascending tier) for rendering pricing tables. */
export const PLAN_LIST = [
  PLANS[PLAN_KEYS.TRIAL_7D],
  PLANS[PLAN_KEYS.PRO_MONTHLY],
  PLANS[PLAN_KEYS.PRO_ANNUAL],
];

/** Statuses that grant product access (subject to period/grace checks). */
export const ACCESS_GRANTING_STATUSES = ["active", "trialing"];

/** All valid subscription lifecycle statuses (mirrors DB CHECK). */
export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "expired",
  "paused",
  "payment_failed",
];

/** Look up a plan by key; returns undefined for unknown keys. */
export function getPlan(planKey) {
  return PLANS[planKey];
}

/** Format a paise amount as an INR string, e.g. 19900 → "₹199". */
export function formatINR(amountInPaise) {
  const rupees = amountInPaise / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Legacy → new plan key mapping. Old one-time keys still appear in existing
 * `payments` rows and in not-yet-migrated code; map them to the closest
 * subscription plan for display/compatibility.
 */
export const LEGACY_PLAN_MAP = {
  report: PLAN_KEYS.TRIAL_7D,
  coach: PLAN_KEYS.PRO_MONTHLY,
  monthly: PLAN_KEYS.PRO_MONTHLY,
};
