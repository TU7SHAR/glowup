"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "See what AI discovers",
    icon: Sparkles,
    features: [
      "Upload 1 selfie",
      "Top 3 strengths revealed",
      "Improvement count shown",
      "Basic face shape analysis",
    ],
    cta: "Try Free",
    style: "border-border hover:border-accent/20",
    ctaStyle: "border border-border hover:border-accent/30 text-silver",
  },
  {
    name: "Glow-Up Report",
    price: "199",
    description: "Complete personalized analysis",
    icon: Zap,
    popular: true,
    features: [
      "Everything in Free",
      "Full detailed breakdown",
      "Hair & beard recommendations",
      "Skincare routine (AM/PM)",
      "Glasses & eyebrow tips",
      "Outfit color palette",
      "AI before/after preview",
      "Shopping suggestions",
    ],
    cta: "Get My Report",
    style: "border-accent/30 bg-accent/[0.02]",
    ctaStyle: "bg-accent hover:bg-accent-dark text-background font-semibold",
  },
  {
    name: "30-Day Coach",
    price: "499",
    description: "Daily accountability & tracking",
    icon: Crown,
    features: [
      "Everything in Report",
      "30-day personalized plan",
      "Daily checklist & reminders",
      "Weekly progress tracking",
      "AI comparison photos",
      "Streak rewards",
      "Priority support",
    ],
    cta: "Start Coaching",
    style: "border-border hover:border-ice/20",
    ctaStyle: "bg-ice/10 border border-ice/30 hover:bg-ice/20 text-ice",
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">Investment</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Choose your <span className="gradient-text">level</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 border ${plan.style} transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-6 bg-accent text-background text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <plan.icon className={`w-6 h-6 ${plan.popular ? "text-accent" : "text-muted"} mb-5`} />
              <h3 className="text-lg font-bold tracking-tight mb-1">{plan.name}</h3>
              <p className="text-xs text-muted mb-5">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price === "0" ? "Free" : `₹${plan.price}`}
                </span>
                {plan.price !== "0" && (
                  <span className="text-xs text-muted ml-1.5">one-time</span>
                )}
              </div>

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
                className={`block text-center py-3 px-6 rounded-full text-sm transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
