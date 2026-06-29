"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  Zap,
  Crown,
  Shield,
  ArrowLeft,
  CreditCard,
  Lock,
  Star,
  TrendingUp,
  Calendar,
  MessageCircle,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";

const plans = [
  {
    id: "report",
    name: "Glow-Up Report",
    price: 199,
    icon: Zap,
    color: "accent",
    description: "Full personalized analysis & recommendations",
    features: [
      "Complete face analysis breakdown",
      "Best haircuts for your face shape",
      "Personalized skincare routine (AM/PM)",
      "Beard/facial hair recommendations",
      "Eyebrow shaping guide",
      "Glasses frame suggestions",
      "Outfit color palette",
      "AI before/after preview",
      "Photo angle tips",
      "Budget shopping suggestions",
    ],
    popular: true,
  },
  {
    id: "coach",
    name: "30-Day Coach",
    price: 499,
    icon: Crown,
    color: "warning",
    description: "Daily accountability + progress tracking",
    features: [
      "Everything in Glow-Up Report",
      "Personalized 30-day challenge",
      "Daily checklist & push reminders",
      "Weekly selfie comparison",
      "AI progress measurement",
      "Streak rewards & badges",
      "Adjusted plan based on progress",
      "Priority support",
    ],
    popular: false,
  },
  {
    id: "monthly",
    name: "Monthly Premium",
    price: 999,
    period: "/month",
    icon: Star,
    color: "pink-400",
    description: "Ongoing coaching & community access",
    features: [
      "Everything in 30-Day Coach",
      "Unlimited selfie analyses",
      "Seasonal style updates",
      "Community leaderboards",
      "Group challenges with friends",
      "New trend recommendations",
      "Priority AI processing",
      "Direct coach chat support",
    ],
    popular: false,
  },
];

const guarantees = [
  {
    icon: Shield,
    label: "Money-Back Guarantee",
    description: "Not satisfied? Full refund within 7 days, no questions asked.",
  },
  {
    icon: Lock,
    label: "Secure Payment",
    description: "256-bit encrypted. Razorpay/Stripe secured transaction.",
  },
  {
    icon: RefreshCcw,
    label: "Instant Access",
    description: "Get your full report within 30 seconds of payment.",
  },
];

const testimonials = [
  {
    name: "Vikram S.",
    text: "The haircut recommendation alone was worth it. Got more compliments in one week than the entire last year.",
    rating: 5,
  },
  {
    name: "Ananya R.",
    text: "I was skeptical but the color palette section changed how I shop entirely. So much more confident now.",
    rating: 5,
  },
  {
    name: "Rohan M.",
    text: "The 30-day plan kept me accountable. My skin cleared up and I finally figured out my beard.",
    rating: 5,
  },
];

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState("report");

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold gradient-text">GlowUp AI</span>
        </Link>
        <Link
          href="/results"
          className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to results
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Unlock Your <span className="gradient-text">Full Potential</span>
          </h1>
          <p className="text-muted max-w-md mx-auto">
            Your personalized glow-up plan is ready. Choose a plan to access your
            complete transformation guide.
          </p>
        </motion.div>

        {/* Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12"
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.1 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative glass rounded-2xl p-6 cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? "border-accent/60 ring-1 ring-accent/30 scale-[1.02]"
                  : "hover:border-accent/30"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
                  RECOMMENDED
                </div>
              )}

              {/* Radio indicator */}
              <div className="flex items-start justify-between mb-4">
                <plan.icon
                  className={`w-8 h-8 ${
                    plan.id === "report"
                      ? "text-accent"
                      : plan.id === "coach"
                      ? "text-warning"
                      : "text-pink-400"
                  }`}
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === plan.id
                      ? "border-accent bg-accent"
                      : "border-muted/50"
                  }`}
                >
                  {selectedPlan === plan.id && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-muted mb-4">{plan.description}</p>

              <div className="mb-5">
                <span className="text-3xl font-bold">₹{plan.price}</span>
                <span className="text-sm text-muted">
                  {plan.period || " one-time"}
                </span>
              </div>

              <ul className="space-y-2.5">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span className="text-muted">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        {/* Payment CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-8 mb-12 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-accent" />
            <span className="font-medium">
              Pay ₹{plans.find((p) => p.id === selectedPlan)?.price} for{" "}
              {plans.find((p) => p.id === selectedPlan)?.name}
            </span>
          </div>
          <button className="w-full max-w-md mx-auto block bg-gradient-to-r from-accent via-purple-500 to-pink-500 hover:opacity-90 text-white py-4 px-8 rounded-full font-semibold text-lg transition-all pulse-glow mb-4">
            Pay Securely with Razorpay
          </button>
          <div className="flex items-center justify-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Secure
            </span>
            <span className="flex items-center gap-1">
              <RefreshCcw className="w-3 h-3" /> 7-day refund
            </span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> Instant access
            </span>
          </div>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h3 className="text-xl font-bold text-center mb-6">
            What Others Say
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="glass rounded-xl p-5">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3.5 h-3.5 fill-warning text-warning"
                    />
                  ))}
                </div>
                <p className="text-sm text-muted mb-3 leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <p className="text-xs font-medium">{testimonial.name}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Guarantees */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          {guarantees.map((guarantee, index) => (
            <div
              key={index}
              className="flex items-start gap-3 glass rounded-xl p-4"
            >
              <guarantee.icon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium mb-1">
                  {guarantee.label}
                </h4>
                <p className="text-xs text-muted">{guarantee.description}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-12"
        >
          <h3 className="text-xl font-bold text-center mb-6">
            Frequently Asked Questions
          </h3>
          <div className="space-y-3">
            {[
              {
                q: "How accurate is the AI analysis?",
                a: "Our AI has been trained on thousands of facial features and styling outcomes. The recommendations are personalized to your unique face shape, skin type, and features.",
              },
              {
                q: "Will my photo be shared or stored?",
                a: "Never. Your photo is processed securely and deleted from our servers after analysis. We take privacy very seriously.",
              },
              {
                q: "What if I'm not satisfied?",
                a: "We offer a full 7-day money-back guarantee. If you're not happy with your report, just email us and we'll refund you instantly.",
              },
              {
                q: "How is this different from other face-rating apps?",
                a: "We don't just rate you. We give you an actionable plan with specific product recommendations, routines, and daily steps to actually improve.",
              },
            ].map((faq, index) => (
              <div key={index} className="glass rounded-xl p-5">
                <h4 className="font-medium text-sm mb-2">{faq.q}</h4>
                <p className="text-xs text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
