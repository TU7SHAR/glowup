"use client";

import { motion } from "framer-motion";
import { Check, Zap, Crown, Star } from "lucide-react";
import Link from "next/link";
import { PLAN_LIST, PLAN_KEYS, formatINR } from "@/app/lib/plans";

const ICONS = {
  [PLAN_KEYS.TRIAL_7D]: Zap,
  [PLAN_KEYS.PRO_MONTHLY]: Crown,
  [PLAN_KEYS.PRO_ANNUAL]: Star,
};

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">Membership</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Your personal <span className="gradient-text">transformation</span> coach
          </h2>
          <p className="text-muted mt-4 max-w-lg mx-auto text-sm">
            Start with a <span className="text-foreground">free analysis</span> — no signup. Subscribe to unlock your full plan. Cancel anytime.
          </p>
        </motion.div>

        {/* Launch pricing banner */}
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-light bg-accent/10 border border-accent/25 rounded-full px-3 py-1">
            <Star className="w-3 h-3" /> Launch pricing — limited time
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PLAN_LIST.map((plan, index) => {
            const Icon = ICONS[plan.key] || Zap;
            const popular = plan.key === PLAN_KEYS.PRO_MONTHLY;
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative rounded-2xl p-8 border transition-all ${
                  popular ? "border-accent/40 bg-accent/[0.03]" : "border-border hover:border-accent/20"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-6 bg-accent text-background text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <Icon className={`w-6 h-6 ${popular ? "text-accent" : "text-muted"} mb-5`} />
                <h3 className="text-lg font-bold tracking-tight mb-1">{plan.name}</h3>
                <p className="text-xs text-muted mb-5">{plan.tagline}</p>

                {/* Anchor price + savings */}
                <div className="flex items-center gap-2 mb-1 h-5">
                  {plan.anchorAmount && (
                    <span className="text-sm text-muted line-through decoration-error/60">
                      {formatINR(plan.anchorAmount)}
                    </span>
                  )}
                  {plan.savingsLabel && (
                    <span className="text-[10px] font-bold text-success bg-success/10 border border-success/25 rounded px-1.5 py-0.5">
                      {plan.savingsLabel}
                    </span>
                  )}
                </div>

                <div className="mb-1">
                  <span className="text-4xl font-bold tracking-tight">{formatINR(plan.amount)}</span>
                  <span className="text-xs text-muted ml-1.5">{plan.shortIntervalLabel}</span>
                </div>
                <p className="text-[11px] text-muted mb-6">
                  {plan.vsMonthlyNote || `Renews ${plan.intervalLabel} · cancel anytime`}
                </p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[13px]">
                      <Check className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                      <span className="text-muted">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/upload"
                  className={`block text-center py-3 px-6 rounded-full text-sm transition-all ${
                    popular
                      ? "bg-accent hover:bg-accent-dark text-background font-semibold"
                      : "border border-border hover:border-accent/30 text-silver"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted mt-8">
          All plans are recurring subscriptions billed in INR. You can cancel anytime and keep access until the end of your billing period.
        </p>
      </div>
    </section>
  );
}
