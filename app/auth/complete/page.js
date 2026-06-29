"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Loader2, Sparkles } from "lucide-react";

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthCompleteContent />
    </Suspense>
  );
}

function AuthCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      const userParam = searchParams.get("user");
      const redirect = searchParams.get("redirect") || "/results";

      if (userParam) {
        const userData = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem("glowup_user", JSON.stringify(userData));
      }

      // Small delay so localStorage write completes before navigation
      setTimeout(() => {
        router.replace(redirect);
      }, 500);
    } catch (e) {
      console.error("[Auth] Complete page error:", e);
      router.replace("/results");
    }
  }, [router, searchParams]);

  return <Loading />;
}

function Loading() {
  return (
    <div className="min-h-screen gradient-bg flex flex-col items-center justify-center gap-4">
      <Sparkles className="w-8 h-8 text-accent" />
      <Loader2 className="w-6 h-6 text-accent animate-spin" />
      <p className="text-muted text-sm">Signing you in...</p>
    </div>
  );
}
