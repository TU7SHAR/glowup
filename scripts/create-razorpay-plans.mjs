#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════
 * Create Razorpay Plans for GlowUp AI subscriptions (run once)
 * ═══════════════════════════════════════════════════════════
 *
 * Razorpay Subscriptions require a Plan to be created up front. This script
 * creates one Razorpay Plan per GlowUp plan and prints the resulting Plan IDs,
 * which you then add to your environment:
 *
 *   RAZORPAY_PLAN_ID_TRIAL_7D=plan_xxx
 *   RAZORPAY_PLAN_ID_PRO_MONTHLY=plan_xxx
 *   RAZORPAY_PLAN_ID_PRO_ANNUAL=plan_xxx
 *
 * Prerequisites:
 *   - Subscriptions must be enabled on your Razorpay account.
 *   - RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET set in the environment.
 *
 * Usage:
 *   node scripts/create-razorpay-plans.mjs
 *
 * Notes:
 *   - Razorpay plan `period`/`interval`:
 *       trial_7d    → period "weekly",  interval 1  (bills every 7 days)
 *       pro_monthly → period "monthly", interval 1
 *       pro_annual  → period "yearly",  interval 1
 *   - This script is idempotent-ish: Razorpay does not dedupe plans, so run it
 *     ONCE and store the IDs. Re-running creates new plans.
 */

import Razorpay from "razorpay";
import { PLAN_LIST } from "../app/lib/plans.js";

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
  console.error("✖ RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.");
  process.exit(1);
}

// Map our interval names → Razorpay `period` values.
const PERIOD_MAP = {
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
};

const razorpay = new Razorpay({ key_id, key_secret });

async function main() {
  console.log("Creating Razorpay plans for GlowUp AI…\n");
  const results = [];

  for (const plan of PLAN_LIST) {
    const period = PERIOD_MAP[plan.interval];
    if (!period) {
      console.error(`✖ Unknown interval "${plan.interval}" for ${plan.key}`);
      continue;
    }

    try {
      const created = await razorpay.plans.create({
        period,
        interval: plan.intervalCount,
        item: {
          name: `GlowUp — ${plan.name}`,
          amount: plan.amount, // paise
          currency: plan.currency,
          description: plan.tagline,
        },
        notes: { glowup_plan_key: plan.key },
      });

      results.push({ envVar: plan.razorpayPlanIdEnv, planId: created.id, name: plan.name });
      console.log(`✔ ${plan.name.padEnd(16)} → ${created.id}`);
    } catch (err) {
      console.error(`✖ Failed to create plan for ${plan.key}:`, err?.error?.description || err?.message || err);
    }
  }

  if (results.length) {
    console.log("\nAdd these to your environment (.env / Vercel):\n");
    for (const r of results) {
      console.log(`${r.envVar}=${r.planId}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
