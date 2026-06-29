"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  Lock,
  ArrowRight,
  Star,
  TrendingUp,
  Scissors,
  Droplets,
  Eye,
  Glasses,
  Palette,
  Shirt,
  Camera,
  Heart,
  ShoppingBag,
  Calendar,
  Zap,
} from "lucide-react";
import Link from "next/link";

const strengths = [
  {
    label: "Smile",
    description: "Natural and warm — your biggest asset",
    score: 9.2,
  },
  {
    label: "Hair Density",
    description: "Thick and healthy, great for styling versatility",
    score: 8.7,
  },
  {
    label: "Eye Shape",
    description: "Well-proportioned with strong symmetry",
    score: 8.4,
  },
  {
    label: "Jawline Definition",
    description: "Above average angularity",
    score: 7.8,
  },
];

const lockedImprovements = [
  {
    icon: Scissors,
    label: "Hairstyle",
    teaser: "3 haircuts that would complement your face shape perfectly",
    impact: "High",
  },
  {
    icon: Droplets,
    label: "Skincare Routine",
    teaser: "Personalized AM/PM routine for clearer, brighter skin",
    impact: "High",
  },
  {
    icon: Shirt,
    label: "Beard Style",
    teaser: "The optimal beard length and shape for your jaw",
    impact: "Medium",
  },
  {
    icon: Eye,
    label: "Eyebrows",
    teaser: "Minor shaping that would balance your features",
    impact: "Medium",
  },
  {
    icon: Glasses,
    label: "Glasses/Frames",
    teaser: "Frame shapes that complement your face geometry",
    impact: "Medium",
  },
  {
    icon: Palette,
    label: "Color Palette",
    teaser: "Your ideal clothing colors based on skin tone & undertone",
    impact: "High",
  },
  {
    icon: Camera,
    label: "Photo Angles",
    teaser: "Best angles and poses for photos based on your features",
    impact: "Low",
  },
  {
    icon: Heart,
    label: "Confidence Tips",
    teaser: "Body language adjustments for maximum presence",
    impact: "Medium",
  },
  {
    icon: ShoppingBag,
    label: "Shopping List",
    teaser: "Budget-friendly product recommendations",
    impact: "Medium",
  },
  {
    icon: Calendar,
    label: "30-Day Plan",
    teaser: "Daily checklist for visible transformation",
    impact: "High",
  },
];

export default function ResultsPage() {
  const [showAllStrengths, setShowAllStrengths] = useState(false);

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold gradient-text">GlowUp AI</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 px-6 py-8 max-w-2xl mx-auto w-full">
        {/* Score summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 text-center mb-8"
        >
          <div className="w-20 h-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your Analysis is Ready</h1>
          <p className="text-muted text-sm mb-6">
            We found <span className="text-accent-light font-semibold">10 personalized improvements</span>{" "}
            that could transform your appearance
          </p>
          <div className="inline-flex items-center gap-2 bg-success/10 text-success text-sm font-medium px-4 py-2 rounded-full">
            <TrendingUp className="w-4 h-4" />
            Estimated improvement: +24-32%
          </div>
        </motion.div>

        {/* Strengths section (FREE) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-warning" />
            <h2 className="text-xl font-bold">Your Biggest Strengths</h2>
          </div>
          <div className="space-y-3">
            {strengths.map((strength, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="glass rounded-xl p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm">{strength.label}</h3>
                    <span className="text-xs font-mono text-success">
                      {strength.score}/10
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate">
                    {strength.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Locked improvements section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold">Improvements Found</h2>
          </div>
          <p className="text-sm text-muted mb-4">
            Unlock your full personalized glow-up plan
          </p>

          <div className="space-y-3">
            {lockedImprovements.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group"
              >
                {/* Blur overlay */}
                <div className="absolute inset-0 bg-surface/40 backdrop-blur-[2px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2 text-accent-light text-sm font-medium">
                    <Lock className="w-4 h-4" />
                    Unlock with Premium
                  </div>
                </div>

                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-accent-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-sm">{item.label}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.impact === "High"
                          ? "bg-accent/10 text-accent-light"
                          : item.impact === "Medium"
                          ? "bg-warning/10 text-warning"
                          : "bg-surface-light text-muted"
                      }`}
                    >
                      {item.impact} impact
                    </span>
                  </div>
                  <p className="text-xs text-muted truncate">{item.teaser}</p>
                </div>
                <Lock className="w-4 h-4 text-muted shrink-0" />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* AI Preview teaser */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="glass rounded-2xl p-6 mb-8 border-accent/30"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-bold">AI Preview Available</h3>
              <p className="text-xs text-muted">See your predicted transformation</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-32 rounded-xl bg-surface-light flex items-center justify-center border border-border">
              <span className="text-xs text-muted">Current</span>
            </div>
            <ArrowRight className="w-5 h-5 text-accent shrink-0" />
            <div className="flex-1 h-32 rounded-xl bg-accent/5 border border-accent/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 backdrop-blur-md" />
              <Lock className="w-6 h-6 text-accent relative z-10" />
            </div>
          </div>
          <p className="text-xs text-muted text-center">
            Visualize your best hairstyle, beard, skin & clothing — all on your photo
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="sticky bottom-6 z-20"
        >
          <Link
            href="/premium"
            className="block w-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 hover:opacity-90 text-white text-center py-4 px-8 rounded-full font-semibold text-lg transition-all pulse-glow"
          >
            Unlock Full Report — ₹199
          </Link>
          <p className="text-center text-xs text-muted mt-3">
            One-time payment &bull; Instant access &bull; Money-back guarantee
          </p>
        </motion.div>
      </main>
    </div>
  );
}
