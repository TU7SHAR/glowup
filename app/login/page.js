"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><Loader2 className="w-8 h-8 text-accent animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/results";

  const [mode, setMode] = useState("login"); // login | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const sessionId = localStorage.getItem("glowup_session_id");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name: mode === "signup" ? name : undefined,
          sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      if (mode === "signup") {
        setSuccess("Account created! You can now track your 30-day progress.");
        setTimeout(() => router.push(redirect), 1500);
      } else {
        router.push(redirect);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <header className="px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" />
          <span className="text-lg font-bold gradient-text">GlowUp AI</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass rounded-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-accent" />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {mode === "login" ? "Welcome Back" : "Create Account"}
              </h1>
              <p className="text-sm text-muted">
                {mode === "login"
                  ? "Sign in to access your reports and track progress"
                  : "Sign up to save your results and start the 30-day challenge"}
              </p>
            </div>

            {/* Error / Success */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success/30 text-success text-sm text-center">
                {success}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Google OAuth Button */}
              <a
                href={`/api/auth/google?redirect=${encodeURIComponent(redirect)}&reason=${reason || ""}`}
                className="flex items-center justify-center gap-3 w-full py-3.5 rounded-full border border-border hover:border-accent/30 hover:bg-surface-light/50 transition-all font-medium text-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </a>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              {mode === "signup" && (
                <div>
                  <label className="block text-xs text-muted mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs text-muted mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "Min 8 characters" : "Your password"}
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    className="w-full bg-surface border border-border rounded-xl pl-10 pr-10 py-3 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold transition-all ${
                  !isLoading && email && password
                    ? "bg-accent hover:bg-accent-dark text-white"
                    : "bg-surface-light text-muted cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Please wait...</>
                ) : (
                  <>{mode === "login" ? "Sign In" : "Create Account"} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-6 text-center text-sm text-muted">
              {mode === "login" ? (
                <p>
                  Don&apos;t have an account?{" "}
                  <button onClick={() => { setMode("signup"); setError(""); }} className="text-accent hover:underline">
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button onClick={() => { setMode("login"); setError(""); }} className="text-accent hover:underline">
                    Sign in
                  </button>
                </p>
              )}
            </div>

            {/* Skip */}
            <div className="mt-4 text-center">
              <Link href={redirect} className="text-xs text-muted hover:text-foreground transition-colors">
                Skip for now →
              </Link>
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 text-center">
            <p className="text-xs text-muted mb-2">Why create an account?</p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted">
              <span>📊 Track progress</span>
              <span>🔥 Streaks</span>
              <span>📧 Daily reminders</span>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
