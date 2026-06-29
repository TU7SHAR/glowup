"use client";

import { motion } from "framer-motion";
import { ArrowRight, TrendingUp } from "lucide-react";

const transformations = [
  {
    name: "Rahul, 24",
    goal: "Dating",
    improvements: ["Hairstyle change", "Skincare routine", "Better glasses"],
    score: "+32%",
    timeline: "28 days",
  },
  {
    name: "Priya, 22",
    goal: "Confidence",
    improvements: ["Hair color", "Eyebrow shaping", "Outfit palette"],
    score: "+27%",
    timeline: "21 days",
  },
  {
    name: "Arjun, 28",
    goal: "Professional",
    improvements: ["Beard styling", "Skincare", "Wardrobe upgrade"],
    score: "+24%",
    timeline: "30 days",
  },
];

export default function Examples() {
  return (
    <section id="examples" className="py-24 px-6 bg-surface/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Real <span className="gradient-text">Transformations</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            See what our AI coach recommended for others like you
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {transformations.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="glass rounded-2xl overflow-hidden group hover:border-accent/30 transition-all"
            >
              {/* Before/After placeholder */}
              <div className="relative h-48 bg-gradient-to-br from-surface-light to-surface flex items-center justify-center">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-surface-light border-2 border-muted/30 flex items-center justify-center">
                    <span className="text-xs text-muted">Before</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-accent" />
                  <div className="w-20 h-20 rounded-full bg-accent/20 border-2 border-accent/50 flex items-center justify-center">
                    <span className="text-xs text-accent-light">After</span>
                  </div>
                </div>
                {/* Score badge */}
                <div className="absolute top-4 right-4 bg-success/20 text-success text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {item.score}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">{item.name}</h3>
                  <span className="text-xs bg-accent/10 text-accent-light px-2 py-1 rounded-full">
                    {item.goal}
                  </span>
                </div>
                <div className="space-y-2 mb-4">
                  {item.improvements.map((imp, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-muted">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {imp}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted border-t border-border pt-3">
                  Results in {item.timeline}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
