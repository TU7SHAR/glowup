import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

/**
 * GET /api/auth/callback
 * Handles OAuth callback from Supabase (Google, etc.)
 * Exchanges the code for a session, then redirects to the app
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/results";
  const reason = searchParams.get("reason") || "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=no_code`);
  }

  try {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[Auth] Callback exchange error:", error);
      return NextResponse.redirect(`${appUrl}/login?error=exchange_failed`);
    }

    // Link any existing anonymous analyses to this user
    const sessionId = request.cookies.get("glowup_session_id")?.value;
    if (sessionId && data.user) {
      const { createAdminClient } = await import("@/app/lib/supabase/server");
      const admin = createAdminClient();

      await admin
        .from("analyses")
        .update({ user_id: data.user.id })
        .eq("session_id", sessionId)
        .is("user_id", null);

      await admin
        .from("payments")
        .update({ user_id: data.user.id })
        .eq("session_id", sessionId)
        .is("user_id", null);
    }

    // Build the redirect URL with user data for localStorage
    const userData = encodeURIComponent(JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email?.split("@")[0],
      avatar: data.user.user_metadata?.avatar_url || "",
    }));

    // Redirect to a client-side page that stores user data and then navigates
    return NextResponse.redirect(
      `${appUrl}/auth/complete?user=${userData}&redirect=${encodeURIComponent(redirect)}`
    );
  } catch (error) {
    console.error("[Auth] Callback error:", error);
    return NextResponse.redirect(`${appUrl}/login?error=callback_failed`);
  }
}
