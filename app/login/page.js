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
