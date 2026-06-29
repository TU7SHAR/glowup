"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Check, Lock, ArrowRight, Star, TrendingUp,
  Scissors, Droplets, Eye, Glasses, Palette, Shirt,
  Camera, Heart, ShoppingBag, Calendar, Zap, Loader2,
  Crown, User,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import DownloadReport from "../components/DownloadReport";
import ShareResults from "../components/ShareResults";
import UpsellSection from "../components/UpsellSection";

const categoryIcons = {
  hair: Scissors, skin: Droplets, beard: Shirt, eyebrows: Eye,
  glasses: Glasses, colors: Palette, accessories: ShoppingBag,
  photo: Camera, confidence: Heart, shopping: ShoppingBag, default: Zap,
};

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}>
      <ResultsContent />
    </Suspense>
  );
}

function ResultsContent() {
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id");
  const unlocked = searchParams.get("unlocked") === "true";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchResults() {
      try {
        const id = analysisId || localStorage.getItem("glowup_analysis_id");
        const sessionId = localStorage.getItem("glowup_session_id");

        if (!id || !sessionId) {
          setError("No analysis found. Please upload a selfie first.");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/results?id=${id}&sessionId=${sessionId}`);
        const result = await res.json();

        if (!res.ok) throw new Error(result.error);
        setData(result);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [analysisId]);

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/upload" className="text-accent underline">Upload a selfie</Link>
        </div>
      </div>
    );
  }


  const strengths = data?.strengths || [];
  const isPaid = data?.isPaid || unlocked;
  const improvements = isPaid ? (data?.improvements || []) : [];
  const lockedImprovements = data?.lockedImprovements || [];
  const fullReport = data?.fullReport || {};

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold gradient-text">GlowUp AI</span>
        </Link>
      </header>

      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        {/* Summary card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-8 text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your Analysis is Ready</h1>
          <p className="text-muted text-sm mb-4">
            {data?.overallVibe || `We found ${data?.improvementCount || "multiple"} personalized improvements`}
          </p>
          {data?.improvementPotential && (
            <div className="inline-flex items-center gap-2 bg-success/10 text-success text-sm font-medium px-4 py-2 rounded-full">
              <TrendingUp className="w-4 h-4" />
              Estimated improvement: +{data.improvementPotential}%
            </div>
          )}
        </motion.div>

        {/* Strengths (FREE) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-warning" />
            <h2 className="text-xl font-bold">Your Biggest Strengths</h2>
          </div>
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="glass rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm">{s.label}</h3>
                    {s.score && <span className="text-xs font-mono text-success">{s.score}/10</span>}
                  </div>
                  <p className="text-xs text-muted truncate">{s.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* PAID: Full improvements */}
        {isPaid && improvements.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold">Your Glow-Up Plan</h2>
            </div>
            <div className="space-y-4">
              {improvements.map((imp, i) => {
                const Icon = categoryIcons[imp.category] || categoryIcons.default;
                return (
                  <div key={i} className="glass rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-accent-light" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{imp.label}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${imp.impact === "high" ? "bg-accent/10 text-accent-light" : "bg-warning/10 text-warning"}`}>{imp.impact} impact</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted mb-3">{imp.description}</p>
                    {imp.recommendations && (
                      <ul className="space-y-1.5">
                        {imp.recommendations.map((rec, j) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-muted">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* FREE: Locked improvements */}
        {!isPaid && lockedImprovements.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-bold">Improvements Found</h2>
            </div>
            <p className="text-sm text-muted mb-4">Unlock your full personalized glow-up plan</p>
            <div className="space-y-3">
              {lockedImprovements.map((imp, i) => {
                const Icon = categoryIcons[imp.category] || categoryIcons.default;
                return (
                  <div key={i} className="glass rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-surface/40 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-2 text-accent-light text-sm font-medium">
                        <Lock className="w-4 h-4" /> Unlock with Premium
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-accent-light" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{imp.label}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${imp.impact === "high" ? "bg-accent/10 text-accent-light" : "bg-warning/10 text-warning"}`}>{imp.impact} impact</span>
                    </div>
                    <Lock className="w-4 h-4 text-muted shrink-0" />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}


        {/* PAID: Full report sections */}
        {isPaid && fullReport.skin_routine && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass rounded-2xl p-6 mb-8">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-400" /> Skincare Routine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-accent-light mb-2">Morning</h4>
                {fullReport.skin_routine.morning?.map((step, i) => (
                  <div key={i} className="text-xs text-muted mb-2">
                    <span className="text-foreground font-medium">{step.step}:</span> {step.product_type}
                  </div>
                ))}
              </div>
              <div>
                <h4 className="text-sm font-medium text-accent-light mb-2">Evening</h4>
                {fullReport.skin_routine.evening?.map((step, i) => (
                  <div key={i} className="text-xs text-muted mb-2">
                    <span className="text-foreground font-medium">{step.step}:</span> {step.product_type}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {isPaid && fullReport.color_palette && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="glass rounded-2xl p-6 mb-8">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-pink-400" /> Your Color Palette</h3>
            <div className="flex gap-3 mb-3">
              {fullReport.color_palette.best_colors?.map((color, i) => (
                <div key={i} className="w-10 h-10 rounded-lg border border-border" style={{ backgroundColor: color }} title={color} />
              ))}
            </div>
            <p className="text-xs text-muted">{fullReport.color_palette.explanation}</p>
          </motion.div>
        )}

        {/* CTA for unpaid */}
        {!isPaid && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="sticky bottom-6 z-20">
            <Link href={`/premium?id=${data?.id || ""}`} className="block w-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 hover:opacity-90 text-white text-center py-4 px-8 rounded-full font-semibold text-lg transition-all pulse-glow">
              Unlock Full Report — ₹199
            </Link>
            <p className="text-center text-xs text-muted mt-3">One-time payment &bull; Instant access &bull; Money-back guarantee</p>
          </motion.div>
        )}

        {/* ── PAID: Download + Share + Plan Badge ── */}
        {isPaid && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className="mb-8">
            {/* Plan badge */}
            <div className="glass rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">
                  {plan === "monthly" ? "Monthly Premium" : plan === "coach" ? "30-Day Coach" : "Glow-Up Report"}
                </span>
              </div>
              <Link href="/login?redirect=/results" className="flex items-center gap-1 text-xs text-accent hover:underline">
                <User className="w-3 h-3" /> Save to account
              </Link>
            </div>

            {/* Download + Share buttons */}
            <div className="flex flex-wrap gap-3">
              <DownloadReport analysisId={data?.id} data={data} />
              <ShareResults analysisId={data?.id} improvementPotential={data?.improvementPotential} />
            </div>
          </motion.div>
        )}

        {/* ── UPSELL SECTION ── */}
        <UpsellSection currentPlan={isPaid ? plan : "free"} analysisId={data?.id} />

        {/* ── Coach plan exclusive: 30-Day Plan ── */}
        {isPaid && (plan === "coach" || plan === "monthly") && fullReport?.thirty_day_plan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="glass rounded-2xl p-6 mb-8">
            <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-warning" /> Your 30-Day Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(fullReport.thirty_day_plan).map(([week, items], i) => (
                <div key={i} className="bg-surface-light/50 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-accent-light mb-2 uppercase">{week.replace("_", " ")}</h4>
                  <ul className="space-y-1.5">
                    {(Array.isArray(items) ? items : [items]).map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Link href="/login?redirect=/progress" className="block mt-4 text-center text-sm text-accent hover:underline">
              Sign up to track daily progress with reminders →
            </Link>
          </motion.div>
        )}

        {/* ── Monthly exclusive: Confidence + Photo Tips ── */}
        {isPaid && plan === "monthly" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }} className="space-y-4 mb-8">
            {fullReport?.confidence_tips && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Heart className="w-5 h-5 text-pink-400" /> Confidence Tips</h3>
                <ul className="space-y-2">
                  {fullReport.confidence_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {fullReport?.photo_tips && (
              <div className="glass rounded-2xl p-6">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Camera className="w-5 h-5 text-blue-400" /> Photo Tips</h3>
                <ul className="space-y-2">
                  {fullReport.photo_tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted">
                      <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
