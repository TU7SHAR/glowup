"use client";

import { useState, useEffect } from "react";
import { Sparkles, User, LogOut } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("glowup_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("glowup_user");
    setUser(null);
    setShowMenu(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? "glass border-b border-accent/5" : "bg-transparent"
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-foreground">Glow</span>
            <span className="text-accent">Up</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-[13px] text-muted uppercase tracking-wider">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">Process</a>
          <a href="#examples" className="hover:text-foreground transition-colors">Results</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-border hover:border-accent/30 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-sm text-silver hidden sm:block">
                  {user.name || user.email?.split("@")[0]}
                </span>
              </button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 glass rounded-xl p-2 min-w-[160px] shadow-xl">
                  <Link href="/results" onClick={() => setShowMenu(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm">
                    <Sparkles className="w-3.5 h-3.5 text-accent" /> My Results
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm text-error">
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-[13px] text-muted hover:text-foreground transition-colors hidden sm:block">
                Sign in
              </Link>
              <Link href="/upload" className="bg-accent/10 border border-accent/30 hover:bg-accent/20 text-accent-light px-5 py-2 rounded-full text-[13px] font-medium transition-all tracking-wide">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
