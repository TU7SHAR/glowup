"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Check, Zap, Crown, Star, Shield, ArrowLeft,
  CreditCard, RefreshCcw, Loader2, XCircle,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PLAN_LIST, PLAN_KEYS, formatINR } from "@/app/lib/plans";

const ICONS = {
  [PLAN_KEYS.TRIAL_7D]: Zap,
  [PLAN_KEYS.PRO_MONTHLY]: Crown,
  [PLAN_KEYS.PRO_ANNUAL]: Star,
};

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}>
      <PremiumContent />
    </Suspense>
  );
}

function PremiumContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const analysisId = searchParams.get("id") || "";

  const [selectedPlan, setSelectedPlan] = useState(PLAN_KEYS.PRO_MONTHLY);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = PLAN_LIST.find((p) => p.key === selectedPlan);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError("");

    try {
      const id = analysisId || localStorage.getItem("glowup_analysis_id") || "";

      // Subscriptions attach to a user account, so require login first.
      const existingUser = localStorage.getItem("glowup_user");
      if (!existingUser) {
        const redirectUrl = `/premium${id ? `?id=${id}` : ""}`;
        router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}&reason=subscribe`);
        return;
      }

      // Create the Razorpay subscription
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan, analysisId: id }),
      });

      const order = await res.json();
      if (!res.ok) {
        if (order.code === "auth_required") {
          const redirectUrl = `/premium${id ? `?id=${id}` : ""}`;
          router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}&reason=subscribe`);
          return;
        }
        throw new Error(order.error || "Could not start subscription");
      }

      // Ensure Razorpay checkout script is loaded
      if (typeof window.Razorpay === "undefined") {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay. Check your connection."));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: order.key,
        subscription_id: order.subscriptionId,
        name: order.name,
        description: order.description,
        theme: { color: "#c8a961" },
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_subscription_id: response.razorpay_subscription_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              router.push(`/results?id=${id}`);
            } else {
              setError("Subscription verification failed. Contact support.");
              setIsLoading(false);
            }
          } catch (e) {
            setError("Verification error. Your payment is safe — contact support.");
            setIsLoading(false);
          }
        },
        modal: { ondismiss: () => setIsLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError(`Payment failed: ${response.error?.description || "Please try again."}`);
        setIsLoading(false);
      });
      rzp.open();
    } catch (e) {
      setError(e.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold gradient-text">GlowUp AI</span>
        </Link>
        <Link href="/results" className="flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </header>

      <main className="flex-1 px-6 py-8 max-w-5xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-3">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Start Your <span className="gradient-text">Transformation</span>
          </h1>
          <p className="text-muted max-w-lg mx-auto">
            Your personalized glow-up plan is ready. Subscribe to unlock your full transformation system — cancel anytime.
          </p>
        </motion.div>

        {/* Limited-time banner */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-light bg-accent/10 border border-accent/25 rounded-full px-3 py-1">
            <Sparkles className="w-3 h-3" /> Launch pricing — limited time
          </span>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-error/10 border border-error/30 text-error text-sm text-center flex items-center justify-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {PLAN_LIST.map((plan, index) => {
            const Icon = ICONS[plan.key] || Zap;
            const isSelected = selectedPlan === plan.key;
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                onClick={() => setSelectedPlan(plan.key)}
                className={`relative glass rounded-2xl p-6 cursor-pointer transition-all ${
                  isSelected ? "border-accent/60 ring-1 ring-accent/30 scale-[1.02]" : "hover:border-accent/30"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-background text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <Icon className="w-8 h-8 text-accent" />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-accent bg-accent" : "border-muted/50"}`}>
                    {isSelected && <Check className="w-3 h-3 text-background" />}
                  </div>
                </div>

                <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                <p className="text-xs text-muted mb-4">{plan.tagline}</p>

                {/* Anchor + price */}
                <div className="mb-1 flex items-center gap-2">
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
                  <span className="text-3xl font-bold">{formatINR(plan.amount)}</span>
                  <span className="text-sm text-muted"> {plan.shortIntervalLabel}</span>
                </div>
                {plan.vsMonthlyNote ? (
                  <p className="text-[11px] text-accent-light mb-4">{plan.vsMonthlyNote}</p>
                ) : (
                  <p className="text-[11px] text-muted mb-4">Renews {plan.intervalLabel} · cancel anytime</p>
                )}

                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                      <span className="text-muted">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* Subscribe */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-8 mb-6">
          <div className="max-w-md mx-auto space-y-4">
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-lg transition-all ${
                !isLoading ? "bg-accent hover:bg-accent-light text-background pulse-glow" : "bg-surface-light text-muted cursor-not-allowed"
              }`}
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing…</>
              ) : (
                <><CreditCard className="w-5 h-5" /> {selected?.cta || "Subscribe"} — {selected ? formatINR(selected.amount) : ""}</>
              )}
            </button>

            {/* Honest recurring disclosure */}
            <p className="text-center text-xs text-muted">
              {selected && (
                <>You&apos;ll be charged <strong className="text-foreground">{formatINR(selected.amount)}</strong>, renewing <strong className="text-foreground">{selected.intervalLabel}</strong>. Cancel anytime — no lock-in.</>
              )}
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure payments</span>
              <span className="flex items-center gap-1"><RefreshCcw className="w-3 h-3" /> Cancel anytime</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Instant access</span>
            </div>
          </div>
        </motion.div>

        {/* Honest value framing (no fake testimonials) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { icon: Sparkles, title: "Personalized to you", text: "Recommendations built from your features, age and goal — not generic tips." },
            { icon: RefreshCcw, title: "Improves over time", text: "Re-analyze your progress and get updated recommendations as you change." },
            { icon: Crown, title: "A coach, not a report", text: "Daily and weekly actions guide your transformation — this isn't a one-off PDF." },
          ].map((v, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <v.icon className="w-5 h-5 text-accent mb-3" />
              <h4 className="font-medium text-sm mb-1">{v.title}</h4>
              <p className="text-xs text-muted leading-relaxed">{v.text}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-3 mb-10">
          {[
            { q: "Is this a recurring subscription?", a: "Yes. Your plan renews automatically at the interval shown (every 7 days, monthly, or yearly). You can cancel anytime and keep access until the end of your current period." },
            { q: "Can I cancel?", a: "Anytime, in one click. There's no lock-in and no cancellation fee. You keep access until your paid period ends." },
            { q: "Is my photo safe?", a: "Your photo is used to generate your analysis and is handled securely. See our privacy policy for how long data is retained." },
            { q: "How is this different from face-rating apps?", a: "GlowUp gives you an actionable, evolving transformation plan — daily steps, product ideas and progress tracking — not just a score." },
          ].map((faq, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <h4 className="font-medium text-sm mb-2">{faq.q}</h4>
              <p className="text-xs text-muted">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
