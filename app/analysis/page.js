"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Check, Loader2, Scissors, Droplets, Ruler, Search, Palette, Brain,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const analysisSteps = [
  { id: 1, icon: Search, label: "Detecting face landmarks", duration: 2200 },
  { id: 2, icon: Ruler, label: "Analyzing facial proportions", duration: 2500 },
  { id: 3, icon: Scissors, label: "Analyzing hairstyle", duration: 2300 },
  { id: 4, icon: Droplets, label: "Analyzing skin quality", duration: 2000 },
  { id: 5, icon: Scissors, label: "Finding best haircut", duration: 2800 },
  { id: 6, icon: Brain, label: "Finding beard style", duration: 2200 },
  { id: 7, icon: Palette, label: "Finding color palette", duration: 2400 },
  { id: 8, icon: Sparkles, label: "Generating recommendations", duration: 3000 },
];

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}>
      <AnalysisContent />
    </Suspense>
  );
}

function AnalysisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  // Poll for results from API
  useEffect(() => {
    if (!analysisId) return;

    const sessionId = localStorage.getItem("glowup_session_id");
    if (!sessionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/results?id=${analysisId}&sessionId=${sessionId}`
        );
        const data = await res.json();

        if (data.status === "completed") {
          clearInterval(pollInterval);
          setIsComplete(true);
          setTimeout(() => {
            router.push(`/results?id=${analysisId}`);
          }, 1500);
        } else if (data.status === "failed") {
          clearInterval(pollInterval);
          setError(data.error || "Analysis failed. Please try again.");
        }
      } catch (e) {
        // Silent fail on poll - animation continues
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [analysisId, router]);


  // Animate steps progressively
  useEffect(() => {
    if (currentStep >= analysisSteps.length) return;

    const timer = setTimeout(() => {
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep((prev) => prev + 1);
    }, analysisSteps[currentStep].duration);

    return () => clearTimeout(timer);
  }, [currentStep]);

  // When all steps animated, mark complete if no poll needed
  useEffect(() => {
    if (completedSteps.length === analysisSteps.length && !analysisId) {
      setIsComplete(true);
      setTimeout(() => router.push("/results"), 1500);
    }
  }, [completedSteps, analysisId, router]);

  const progress = (completedSteps.length / analysisSteps.length) * 100;

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <header className="px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold gradient-text">GlowUp AI</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
              {error}
              <button onClick={() => router.push("/upload")} className="block mx-auto mt-3 text-accent underline text-xs">
                Try Again
              </button>
            </motion.div>
          )}

          {/* Scan visualization */}
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative mb-10">
            <div className="w-40 h-40 mx-auto rounded-full bg-surface border border-border relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-24 rounded-full bg-surface-light border border-border/50" />
              </div>
              {!isComplete && (
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent scan-line" />
                </div>
              )}
              {isComplete && (
                <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 flex items-center justify-center bg-success/10">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-success" />
                  </div>
                </motion.div>
              )}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-accent/60 rounded-tl" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-accent/60 rounded-tr" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-accent/60 rounded-bl" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-accent/60 rounded-br" />
            </div>
          </motion.div>


          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">
              {isComplete ? <span className="text-success">Analysis Complete!</span> : "Analyzing your features..."}
            </h1>
            <p className="text-sm text-muted">
              {isComplete ? "Redirecting to your results..." : "Our AI is examining 50+ facial attributes"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs text-muted mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-accent to-pink-500 rounded-full" initial={{ width: "0%" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            {analysisSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isCurrent = currentStep === index;

              return (
                <motion.div key={step.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${isCurrent ? "glass border-accent/30" : isCompleted ? "bg-success/5" : "opacity-40"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isCompleted ? "bg-success/20" : isCurrent ? "bg-accent/20" : "bg-surface-light"}`}>
                    {isCompleted ? <Check className="w-4 h-4 text-success" /> : isCurrent ? <Loader2 className="w-4 h-4 text-accent animate-spin" /> : <step.icon className="w-4 h-4 text-muted" />}
                  </div>
                  <span className={`text-sm ${isCompleted ? "text-success" : isCurrent ? "text-foreground font-medium" : "text-muted"}`}>{step.label}</span>
                  {isCompleted && <motion.span initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="ml-auto text-xs text-success font-medium">Done</motion.span>}
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
