"use client";

import { motion } from "framer-motion";
import {
  Scissors,
  Droplets,
  Shirt,
  Eye,
  Glasses,
  Palette,
  Watch,
  ImageIcon,
  Heart,
  ShoppingBag,
  Calendar,
  Users,
} from "lucide-react";

const features = [
  { icon: Scissors, label: "Hair", desc: "Best cuts for your face shape" },
  { icon: Droplets, label: "Skin", desc: "AM/PM routine personalized" },
  { icon: Shirt, label: "Beard", desc: "Grow, trim, or clean shave" },
  { icon: Eye, label: "Eyebrows", desc: "Shape that suits you" },
  { icon: Glasses, label: "Glasses", desc: "Frame recommendations" },
  { icon: Palette, label: "Colors", desc: "Your ideal outfit palette" },
  { icon: Watch, label: "Accessories", desc: "Elevate your look" },
  { icon: ImageIcon, label: "Photo Tips", desc: "Look great in every photo" },
  { icon: Heart, label: "Confidence", desc: "Body language coaching" },
  { icon: ShoppingBag, label: "Shopping", desc: "Budget-friendly picks" },
  { icon: Calendar, label: "30-Day Plan", desc: "Daily checklist" },
  { icon: Users, label: "Community", desc: "Challenges & streaks" },
];

export default function Features() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You <span className="gradient-text">Need</span>
          </h2>
          <p className="text-lg text-muted max-w-xl mx-auto">
            A complete personal styling system powered by AI
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-xl p-4 hover:border-accent/30 hover:bg-surface-light/50 transition-all cursor-default group"
            >
              <feature.icon className="w-6 h-6 text-accent-light mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-medium text-sm mb-1">{feature.label}</h3>
              <p className="text-xs text-muted">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
