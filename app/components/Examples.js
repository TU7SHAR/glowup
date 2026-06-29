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
    <section id="examples" className="py-28 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">
            Transformations
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Real <span className="gradient-text">results</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {transformations.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12 }}
              className="rounded-2xl border border-border p-6
                hover:border-accent/20 transition-all group"
            >

              {/* Before/After placeholder */}
              <div className="relative h-40 rounded-xl bg-surface mb-5 flex items-center justify-center overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-surface-light border border-border flex items-center justify-center">
                    <span className="text-[10px] text-muted uppercase tracking-wider">Before</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-accent/50" />
                  <div className="w-16 h-16 rounded-full bg-accent/5 border border-accent/20 flex items-center justify-center">
                    <span className="text-[10px] text-accent-light uppercase tracking-wider">After</span>
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-success/10 text-success text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {item.score}
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <span className="text-[10px] bg-accent/5 text-accent-light px-2 py-0.5 rounded-full border border-accent/10 uppercase tracking-wider">
                  {item.goal}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                {item.improvements.map((imp, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-muted">
                    <div className="w-1 h-1 rounded-full bg-accent" />
                    {imp}
                  </div>
                ))}
              </div>
              <div className="text-[11px] text-muted border-t border-border pt-3 tracking-wide">
                Results in {item.timeline}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
