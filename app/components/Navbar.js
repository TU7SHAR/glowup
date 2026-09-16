"use client";

import { useState, useEffect } from "react";
import { Sparkles, User, LogOut, Loader2, Mail, BadgeCheck } from "lucide-react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

// ─── OAuth safety net ───────────────────────────────
// Google/Supabase can redirect back with `?code=...` on the wrong path
// (e.g. the homepage) instead of our /api/auth/callback route. If we detect a
// stray code, forward it to the callback so login always completes — then the
// URL is cleaned up by the callback redirect. Runs synchronously (module scope
// via a helper) so we never flash the signed-out navbar.
function catchStrayOAuthCode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const onCallback = window.location.pathname.startsWith("/api/auth");
  if (code && !onCallback) {
    const redirect =
      params.get("redirect") || window.location.pathname || "/results";
    window.location.replace(
      `/api/auth/callback?code=${encodeURIComponent(code)}&redirect=${encodeURIComponent(redirect)}`
    );
    return true;
  }
  return false;
}

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Lazy initializer runs during render (not in an effect), so no setState-in-effect.
  const [finishingLogin] = useState(() => catchStrayOAuthCode());

  useEffect(() => {
    if (finishingLogin) return; // we're navigating away to the callback

    const storedUser = localStorage.getItem("glowup_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [finishingLogin]);

  // Close the menu when clicking outside of it.
  useEffect(() => {
    if (!showMenu) return;
    const close = (e) => {
      if (!e.target.closest?.("[data-profile-menu]")) setShowMenu(false);
    };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showMenu]);

  const handleLogout = () => {
    localStorage.removeItem("glowup_user");
    setUser(null);
    setShowMenu(false);
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "Account";
  const initial = displayName?.charAt(0)?.toUpperCase() || "U";

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
          {finishingLogin ? (
            <span className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="w-4 h-4 animate-spin text-accent" /> Signing in…
            </span>
          ) : user ? (
            <div className="relative" data-profile-menu>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full border border-border hover:border-accent/30 transition-all"
              >
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt={displayName}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent text-xs font-semibold">
                    {initial}
                  </div>
                )}
                <span className="text-sm text-silver hidden sm:block max-w-[120px] truncate">
                  {displayName}
                </span>
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 glass rounded-xl p-2 min-w-[240px] shadow-xl">
                  {/* Account details */}
                  <div className="px-3 py-3 border-b border-border/60 mb-1">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatar}
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent text-sm font-semibold">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate flex items-center gap-1">
                          {displayName}
                          <BadgeCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                        </p>
                        {user.email && (
                          <p className="text-xs text-muted truncate flex items-center gap-1">
                            <Mail className="w-3 h-3 shrink-0" /> {user.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href="/results"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent" /> My Results
                  </Link>
                  <Link
                    href="/premium"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm"
                  >
                    <User className="w-3.5 h-3.5 text-accent" /> Manage Plan
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg hover:bg-surface-light transition-colors text-sm text-error"
                  >
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
