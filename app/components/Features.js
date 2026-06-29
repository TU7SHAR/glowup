"use client";

import { motion } from "framer-motion";
import {
  Scissors, Droplets, Shirt, Eye, Glasses, Palette,
  Watch, ImageIcon, Heart, ShoppingBag, Calendar, Users,
} from "lucide-react";

const features = [
  { icon: Scissors, label: "Hair", desc: "Best cuts for your face" },
  { icon: Droplets, label: "Skin", desc: "AM/PM routine" },
  { icon: Shirt, label: "Beard", desc: "Grow, trim, or shave" },
  { icon: Eye, label: "Eyebrows", desc: "Shape that suits" },
  { icon: Glasses, label: "Glasses", desc: "Frame recommendations" },
  { icon: Palette, label: "Colors", desc: "Ideal outfit palette" },
  { icon: Watch, label: "Accessories", desc: "Elevate your look" },
  { icon: ImageIcon, label: "Photo Tips", desc: "Best angles for you" },
  { icon: Heart, label: "Confidence", desc: "Body language coaching" },
  { icon: ShoppingBag, label: "Shopping", desc: "Budget-friendly picks" },
  { icon: Calendar, label: "30-Day Plan", desc: "Daily checklist" },
  { icon: Users, label: "Community", desc: "Challenges & streaks" },
];

export default function Features() {
  return (
    <section className="py-28 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-accent mb-4">
            What You Get
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Complete <span className="gradient-text">system</span>
          </h2>
        </motion.div>


        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-border/30 rounded-2xl overflow-hidden">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.04 }}
              className="bg-background p-6 group hover:bg-surface/50 transition-all"
            >
              <feature.icon className="w-5 h-5 text-accent/70 mb-4 group-hover:text-accent transition-colors" />
              <h3 className="font-medium text-sm mb-1 tracking-tight">{feature.label}</h3>
              <p className="text-xs text-muted">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
