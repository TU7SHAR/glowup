"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-border">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-sm font-bold tracking-tight">
              <span className="text-foreground">Glow</span>
              <span className="text-accent">Up</span>
            </span>
          </div>
          <div className="flex items-center gap-8 text-xs text-muted uppercase tracking-wider">
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          <p className="text-xs text-muted">&copy; 2026 GlowUp AI</p>
        </div>
      </div>
    </footer>
  );
}
