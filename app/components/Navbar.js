"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-accent" />
          <span className="text-xl font-bold gradient-text">GlowUp AI</span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm text-muted">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How It Works
          </a>
          <a href="#examples" className="hover:text-foreground transition-colors">
            Examples
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
        </div>
        <Link
          href="/upload"
          className="bg-accent hover:bg-accent-dark text-white px-5 py-2 rounded-full text-sm font-medium transition-all glow-hover"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}
