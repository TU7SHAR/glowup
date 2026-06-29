"use client";

import { motion } from "framer-motion";
import { Camera, Brain, Sparkles, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: Camera,
    title: "Upload a Selfie",
    description: "Take or upload a clear front-facing photo. We analyze 50+ facial features.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: Brain,
    title: "AI Analyzes You",
    description: "Our AI identifies your strengths and finds the highest-impact improvements.",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    icon: Sparkles,
    title: "Get Your Plan",
    description: "Receive a personalized glow-up roadmap with actionable daily steps.",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Upload weekly selfies. AI measures improvement and adjusts your plan.",
    color: "text-green-400",
    bg: "bg-green-500/10",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 relative">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            From selfie to transformation in 4 simple steps
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass rounded-2xl p-6 hover:border-accent/30 transition-all group"
            >
              <div className={`${step.bg} w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <step.icon className={`w-7 h-7 ${step.color}`} />
              </div>
              <div className="text-xs text-accent font-mono mb-2">
                STEP {index + 1}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
