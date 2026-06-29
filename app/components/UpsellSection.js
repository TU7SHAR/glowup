"use client";

import { motion } from "framer-motion";
import {
  Crown,
  Zap,
  Calendar,
  TrendingUp,
  Users,
  ArrowRight,
  Sparkles,
  Gift,
} from "lucide-react";
import Link from "next/link";

/**
 * Upsell section shown after results (free → paid, report → coach, etc.)
 */
export default function UpsellSection({ currentPlan, analysisId }) {
  // Determine what to upsell based on current plan
  const upsells = getUpsells(currentPlan);

  if (!upsells.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-warning" />
        <h2 className="text-lg font-bold">Level Up Your Glow</h2>
      </div>

      <div className="space-y-4">
        {upsells.map((upsell, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.1 + index * 0.1 }}
          >
            <Link
              href={upsell.href}
              className="block glass rounded-xl p-5 hover:border-accent/40 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl ${upsell.iconBg} flex items-center justify-center shrink-0`}>
                  <upsell.icon className={`w-6 h-6 ${upsell.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-sm">{upsell.title}</h3>
                    {upsell.badge && (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                        {upsell.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted leading-relaxed mb-2">
                    {upsell.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-accent-light">
                      {upsell.price}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-accent group-hover:translate-x-1 transition-transform">
                      {upsell.cta} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Referral upsell */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
        className="mt-4 glass rounded-xl p-5 border-warning/20"
      >
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-5 h-5 text-warning" />
          <h3 className="font-semibold text-sm">Refer a Friend</h3>
        </div>
        <p className="text-xs text-muted mb-3">
          Share GlowUp AI with friends. When they upgrade, you both get a
          free month of the 30-Day Coach plan.
        </p>
        <div className="flex items-center gap-2">
          <code className="text-xs bg-surface-light px-3 py-1.5 rounded-lg text-accent-light flex-1 truncate">
            glowupai.com/invite/{analysisId?.slice(0, 8) || "you"}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/upload?ref=${analysisId?.slice(0, 8) || "you"}`
              );
            }}
            className="text-xs bg-warning/10 text-warning px-3 py-1.5 rounded-lg font-medium hover:bg-warning/20 transition-colors"
          >
            Copy
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getUpsells(currentPlan) {
  if (!currentPlan || currentPlan === "free") {
    // Free users → upsell to Report
    return [
      {
        icon: Zap,
        iconBg: "bg-accent/10",
        iconColor: "text-accent",
        title: "Unlock Full Glow-Up Report",
        description:
          "Get specific haircut recommendations, personalized skincare routine, color palette, and 30-day action plan.",
        price: "₹199",
        cta: "Get Report",
        href: "/premium",
        badge: "Most Popular",
      },
      {
        icon: Crown,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
        title: "30-Day Transformation Coach",
        description:
          "Daily checklist, weekly progress photos, streak tracking, and AI comparison to measure real improvement.",
        price: "₹499",
        cta: "Start Challenge",
        href: "/premium",
        badge: "Best Value",
      },
    ];
  }

  if (currentPlan === "report") {
    // Report buyers → upsell to Coach
    return [
      {
        icon: Calendar,
        iconBg: "bg-warning/10",
        iconColor: "text-warning",
        title: "Upgrade to 30-Day Coach",
        description:
          "You have the plan — now let us keep you accountable. Daily reminders, weekly selfie comparison, and streak rewards.",
        price: "₹300 more",
        cta: "Add Coaching",
        href: "/premium",
        badge: "Recommended",
      },
      {
        icon: TrendingUp,
        iconBg: "bg-success/10",
        iconColor: "text-success",
        title: "Monthly Premium",
        description:
          "Unlimited analyses, seasonal updates, community challenges, and direct coach support.",
        price: "₹999/mo",
        cta: "Go Premium",
        href: "/premium",
        badge: null,
      },
    ];
  }

  if (currentPlan === "coach") {
    // Coach users → upsell to Monthly
    return [
      {
        icon: Sparkles,
        iconBg: "bg-pink-500/10",
        iconColor: "text-pink-400",
        title: "Continue with Monthly Premium",
        description:
          "Your 30 days are almost up! Keep the momentum going with unlimited analyses, community leaderboards, and seasonal style updates.",
        price: "₹999/mo",
        cta: "Go Premium",
        href: "/premium",
        badge: "Don't lose your streak!",
      },
    ];
  }

  return [];
}
