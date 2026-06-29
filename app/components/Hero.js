"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, Sparkles, Star } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-bg overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-24">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full text-sm text-muted mb-8"
        >
          <Star className="w-4 h-4 text-warning" />
          <span>Trusted by 10,000+ people transforming their look</span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold leading-tight mb-6"
        >
          Become{" "}
          <span className="gradient-text">20% More Attractive</span>
          <br />
          Without Surgery.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-muted max-w-2xl mx-auto mb-10"
        >
          AI builds a personalized{" "}
          <span className="text-foreground font-medium">30-day glow-up roadmap</span>{" "}
          based on your unique features. Hair, skin, style & confidence — all covered.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link
            href="/upload"
            className="group flex items-center gap-3 bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-full text-lg font-semibold transition-all pulse-glow"
          >
            <Camera className="w-5 h-5" />
            Upload My Selfie
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-muted">
            Free analysis &bull; No signup required
          </p>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col items-center gap-4"
        >
          {/* Avatar stack */}
          <div className="flex items-center -space-x-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-surface-light border-2 border-background flex items-center justify-center text-xs font-medium"
              >
                <Sparkles className="w-4 h-4 text-accent-light" />
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-background flex items-center justify-center text-xs font-bold text-accent">
              +9k
            </div>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className="w-4 h-4 fill-warning text-warning"
              />
            ))}
            <span className="text-sm text-muted ml-2">
              4.9/5 from 2,400+ reviews
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
