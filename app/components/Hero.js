"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, Sparkles, Star } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/[0.04] rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-ice/[0.03] rounded-full blur-[100px]" />

      {/* Grid lines (subtle luxury texture) */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(200,169,97,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(200,169,97,0.3) 1px, transparent 1px)`,
        backgroundSize: "80px 80px"
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-28">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 border border-accent/20 bg-accent/[0.04] px-4 py-2 rounded-full text-xs tracking-wide text-accent-light uppercase mb-10"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI-Powered Personal Styling</span>
        </motion.div>

        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight mb-8"
        >
          Become the
          <br />
          <span className="gradient-text">Best Version</span>
          <br />
          of Yourself.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-lg md:text-xl text-muted max-w-xl mx-auto mb-12 leading-relaxed"
        >
          AI analyzes your features and builds a personalized 30-day transformation roadmap.
          Hair. Skin. Style. Confidence.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-col items-center gap-5"
        >
          <Link
            href="/upload"
            className="group flex items-center gap-3 bg-accent hover:bg-accent-dark text-background px-8 py-4 rounded-full text-base font-semibold transition-all pulse-glow"
          >
            <Camera className="w-5 h-5" />
            Start My Analysis
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-xs text-muted tracking-wide">
            Free analysis &middot; No signup required &middot; Results in 30 seconds
          </p>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 flex flex-col items-center gap-4"
        >
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-accent text-accent" />
            ))}
          </div>
          <p className="text-sm text-muted">
            Rated <span className="text-foreground font-medium">4.9/5</span> by 2,400+ users
          </p>
          <div className="h-px w-16 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
