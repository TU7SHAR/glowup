import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow via Supabase Auth
 * Supabase handles the full OAuth dance — we just redirect to their URL
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const redirect = searchParams.get("redirect") || "/results";
    const reason = searchParams.get("reason") || "";

    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Build callback URL with original redirect info
    const callbackUrl = `${appUrl}/api/auth/callback?redirect=${encodeURIComponent(redirect)}&reason=${reason}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("[Auth] Google OAuth error:", error);
      return NextResponse.redirect(`${appUrl}/login?error=oauth_failed`);
    }

    // Redirect to Google's consent screen
    return NextResponse.redirect(data.url);
  } catch (error) {
    console.error("[Auth] Google route error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${appUrl}/login?error=server_error`);
  }
}
