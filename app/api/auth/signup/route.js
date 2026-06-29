import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";
import { validateOrigin, rateLimit, sanitizeInput } from "@/app/lib/security";

/**
 * POST /api/auth/signup
 * Sign up a user (for progress tracking / 30-day challenge)
 */
export async function POST(request) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    const { allowed } = rateLimit({ key: `signup:${clientIp}`, maxRequests: 5, windowMs: 300000 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await request.json();
    const { email, password, name, sessionId } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Create user
    const { data, error } = await supabase.auth.admin.createUser({
      email: sanitizeInput(email).toLowerCase().trim(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: sanitizeInput(name || ""),
      },
    });

    if (error) {
      if (error.message.includes("already")) {
        return NextResponse.json({ error: "Account already exists" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }


    // Link existing analyses to this user (if sessionId provided)
    if (sessionId && data.user) {
      await supabase
        .from("analyses")
        .update({ user_id: data.user.id })
        .eq("session_id", sessionId);

      await supabase
        .from("payments")
        .update({ user_id: data.user.id })
        .eq("session_id", sessionId);
    }

    return NextResponse.json({
      success: true,
      userId: data.user.id,
      message: "Account created successfully",
    });
  } catch (error) {
    console.error("[API] /auth/signup error:", error);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
