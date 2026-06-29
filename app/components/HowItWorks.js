"use client";

import { motion } from "framer-motion";
import { Camera, Brain, Sparkles, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Upload",
    description: "One clear selfie. That's all we need.",
    number: "01",
  },
  {
    icon: Brain,
    title: "Analyze",
    description: "AI maps 50+ features against style databases.",
    number: "02",
  },
  {
    icon: Sparkles,
    title: "Plan",
    description: "Receive a curated transformation roadmap.",
    number: "03",
  },
  {
    icon: TrendingUp,
    title: "Transform",
    description: "Track weekly progress. See real change.",
    number: "04",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">The Process</p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Four steps to your
            <br />
            <span className="gradient-text">best self</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-border/50 rounded-2xl overflow-hidden">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-background p-8 relative group"
            >
              <span className="text-5xl font-bold text-surface-light group-hover:text-accent/10 transition-colors absolute top-6 right-6">
                {step.number}
              </span>
              <step.icon className="w-6 h-6 text-accent mb-6" />
              <h3 className="text-lg font-semibold mb-2 tracking-tight">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
