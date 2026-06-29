"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "See what AI finds",
    icon: Sparkles,
    color: "text-muted",
    borderColor: "border-border",
    features: [
      "Upload 1 selfie",
      "Top 3 strengths revealed",
      "Number of improvements found",
      "Basic face shape analysis",
    ],
    cta: "Try Free",
    ctaStyle: "border border-border hover:border-accent/50 text-foreground",
    popular: false,
  },
  {
    name: "Glow-Up Report",
    price: "199",
    description: "Full personalized analysis",
    icon: Zap,
    color: "text-accent",
    borderColor: "border-accent/50",
    features: [
      "Everything in Free",
      "Full detailed analysis",
      "Hair & beard recommendations",
      "Skin routine (AM/PM)",
      "Glasses & eyebrow tips",
      "Outfit color palette",
      "AI before/after preview",
      "Shopping suggestions",
    ],
    cta: "Get My Report",
    ctaStyle: "bg-accent hover:bg-accent-dark text-white pulse-glow",
    popular: true,
  },
  {
    name: "30-Day Coach",
    price: "499",
    description: "Daily accountability + tracking",
    icon: Crown,
    color: "text-warning",
    borderColor: "border-warning/30",
    features: [
      "Everything in Glow-Up Report",
      "30-day personalized plan",
      "Daily checklist & reminders",
      "Weekly progress tracking",
      "AI comparison photos",
      "Streak rewards",
      "Priority support",
    ],
    cta: "Start Coaching",
    ctaStyle: "bg-gradient-to-r from-accent to-pink-500 hover:opacity-90 text-white",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-surface/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Start free. Upgrade when you see the value.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative glass rounded-2xl p-8 ${plan.borderColor} ${
                plan.popular ? "ring-1 ring-accent/50 scale-105" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <plan.icon className={`w-8 h-8 ${plan.color} mb-4`} />
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <p className="text-sm text-muted mb-4">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {plan.price === "0" ? "Free" : `₹${plan.price}`}
                </span>
                {plan.price !== "0" && (
                  <span className="text-sm text-muted ml-1">one-time</span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="text-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/upload"
                className={`block text-center py-3 px-6 rounded-full font-medium transition-all ${plan.ctaStyle}`}
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
