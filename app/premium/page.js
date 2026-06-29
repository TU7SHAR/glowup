"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Check, Zap, Crown, Shield, ArrowLeft,
  CreditCard, Lock, Star, RefreshCcw, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const plans = [
  {
    id: "report", name: "Glow-Up Report", price: 199, icon: Zap, color: "text-accent",
    description: "Full personalized analysis & recommendations",
    features: ["Complete face analysis", "Best haircuts for face shape", "Personalized skincare (AM/PM)", "Beard recommendations", "Eyebrow shaping guide", "Glasses frames", "Outfit color palette", "AI before/after preview", "Budget shopping suggestions"],
    popular: true,
  },
  {
    id: "coach", name: "30-Day Coach", price: 499, icon: Crown, color: "text-warning",
    description: "Daily accountability + progress tracking",
    features: ["Everything in Glow-Up Report", "30-day personalized plan", "Daily checklist & reminders", "Weekly selfie comparison", "AI progress measurement", "Streak rewards", "Priority support"],
    popular: false,
  },
  {
    id: "monthly", name: "Monthly Premium", price: 999, icon: Star, color: "text-pink-400",
    description: "Ongoing coaching & community",
    features: ["Everything in 30-Day Coach", "Unlimited selfie analyses", "Seasonal style updates", "Community leaderboards", "Group challenges", "Direct coach support"],
    popular: false,
  },
];

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

  const [selectedPlan, setSelectedPlan] = useState("report");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");


  const handlePayment = async () => {
    setIsLoading(true);
    setError("");

    try {
      const sessionId = localStorage.getItem("glowup_session_id");
      const id = analysisId || localStorage.getItem("glowup_analysis_id");

      if (!id || !sessionId) {
        throw new Error("No analysis found. Please upload a selfie first.");
      }

      // Create Razorpay order
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          analysisId: id,
          sessionId,
          email,
          name,
        }),
      });

      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      // Open Razorpay checkout
      if (typeof window.Razorpay === "undefined") {
        // Script hasn't loaded yet — load it manually
        await new Promise((resolve, reject) => {
          if (typeof window.Razorpay !== "undefined") {
            resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = resolve;
          script.onerror = () => reject(new Error("Failed to load Razorpay. Check your internet connection."));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        order_id: order.orderId,
        prefill: { email, name },
        theme: { color: "#a855f7" },
        handler: async function (response) {
          // Verify payment
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                sessionId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              // Check if user is logged in
              const existingUser = localStorage.getItem("glowup_user");
              if (existingUser) {
                // Already logged in — go straight to results
                router.push(`/results?id=${id}&unlocked=true`);
              } else {
                // ENFORCE LOGIN after payment — to save report to their account
                router.push(`/login?redirect=/results?id=${id}%26unlocked=true&reason=payment`);
              }
            } else {
              setError("Payment verification failed. Contact support.");
              setIsLoading(false);
            }
          } catch (e) {
            setError("Verification error. Your payment is safe - contact support.");
            setIsLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError(`Payment failed: ${response.error.description}`);
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

      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Unlock Your <span className="gradient-text">Full Potential</span></h1>
          <p className="text-muted max-w-md mx-auto">Your personalized glow-up plan is ready. Choose a plan to access your complete transformation guide.</p>
        </motion.div>

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </motion.div>
        )}

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {plans.map((plan, index) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + index * 0.1 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative glass rounded-2xl p-6 cursor-pointer transition-all ${selectedPlan === plan.id ? "border-accent/60 ring-1 ring-accent/30 scale-[1.02]" : "hover:border-accent/30"}`}>
              {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">RECOMMENDED</div>}
              <div className="flex items-start justify-between mb-4">
                <plan.icon className={`w-8 h-8 ${plan.color}`} />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.id ? "border-accent bg-accent" : "border-muted/50"}`}>
                  {selectedPlan === plan.id && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <p className="text-xs text-muted mb-4">{plan.description}</p>
              <div className="mb-5">
                <span className="text-3xl font-bold">₹{plan.price}</span>
                <span className="text-sm text-muted">{plan.id === "monthly" ? "/month" : " one-time"}</span>
              </div>
              <ul className="space-y-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs"><Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" /><span className="text-muted">{f}</span></li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>


        {/* Email + Payment */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-8 mb-10">
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block text-xs text-muted mb-1">Email (to receive your report)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Name (optional)</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 text-sm" />
            </div>
            <button onClick={handlePayment} disabled={isLoading || !email} className={`w-full flex items-center justify-center gap-2 py-4 rounded-full font-semibold text-lg transition-all ${!isLoading && email ? "bg-gradient-to-r from-accent via-purple-500 to-pink-500 hover:opacity-90 text-white pulse-glow" : "bg-surface-light text-muted cursor-not-allowed"}`}>
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><CreditCard className="w-5 h-5" /> Pay ₹{plans.find(p => p.id === selectedPlan)?.price} Securely</>}
            </button>
            <div className="flex items-center justify-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure</span>
              <span className="flex items-center gap-1"><RefreshCcw className="w-3 h-3" /> 7-day refund</span>
              <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Instant access</span>
            </div>
          </div>
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { name: "Vikram S.", text: "The haircut recommendation alone was worth it. Got more compliments in one week than the entire last year.", rating: 5 },
            { name: "Ananya R.", text: "The color palette section changed how I shop entirely. So much more confident now.", rating: 5 },
            { name: "Rohan M.", text: "The 30-day plan kept me accountable. My skin cleared up and I finally figured out my beard.", rating: 5 },
          ].map((t, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-3.5 h-3.5 fill-warning text-warning" />)}
              </div>
              <p className="text-sm text-muted mb-3 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
              <p className="text-xs font-medium">{t.name}</p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="space-y-3 mb-10">
          {[
            { q: "Is my photo safe?", a: "Yes. Photos are encrypted, never shared, and deleted after analysis." },
            { q: "What if I'm not satisfied?", a: "Full 7-day money-back guarantee. Email us and we refund instantly." },
            { q: "How is this different from face-rating apps?", a: "We give you an actionable plan with specific products and daily steps — not just a score." },
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
