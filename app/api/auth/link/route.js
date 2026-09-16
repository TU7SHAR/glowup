import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/app/lib/supabase/server";
import { validateOrigin } from "@/app/lib/security";

/**
 * POST /api/auth/link
 * Links any anonymous analyses/payments (created before signup/login, keyed by
 * sessionId) to the now-authenticated user.
 *
 * Auth itself happens on the CLIENT via the browser Supabase client so a real
 * session cookie is set. This route just reads that session and does the
 * ownership linking with the admin client.
 */
export async function POST(request) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { sessionId } = await request.json().catch(() => ({}));

    // The real session is read from the cookie set by the browser client.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (sessionId) {
      const admin = createAdminClient();
      await admin
        .from("analyses")
        .update({ user_id: user.id })
        .eq("session_id", sessionId)
        .is("user_id", null);
      await admin
        .from("payments")
        .update({ user_id: user.id })
        .eq("session_id", sessionId)
        .is("user_id", null);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "",
        avatar: user.user_metadata?.avatar_url || "",
      },
    });
  } catch (error) {
    console.error("[API] /auth/link error:", error);
    return NextResponse.json({ error: "Link failed" }, { status: 500 });
  }
}
