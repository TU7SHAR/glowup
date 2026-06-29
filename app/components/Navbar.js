"use client";

import { useState, useEffect } from "react";
import { Sparkles, User, LogOut } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Check if user is logged in (stored in localStorage after login)
    const storedUser = localStorage.getItem("glowup_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("glowup_user");
    setUser(null);
    setShowMenu(false);
  };

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

        <div className="flex items-center gap-3">
          {user ? (
            /* Logged in state */
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-full border border-border hover:border-accent/30 transition-all"
              >
                <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-accent-light" />
                </div>
                <span className="text-sm text-foreground hidden sm:block">
                  {user.name || user.email?.split("@")[0] || "Account"}
                </span>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 glass rounded-xl p-2 min-w-[180px] shadow-xl">
                  <Link
                    href="/results"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm"
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                    My Results
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Logged out state */
            <>
              <Link
                href="/login"
                className="text-sm text-muted hover:text-foreground transition-colors hidden sm:block"
              >
                Log in
              </Link>
              <Link
                href="/upload"
                className="bg-accent hover:bg-accent-dark text-white px-5 py-2 rounded-full text-sm font-medium transition-all glow-hover"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
