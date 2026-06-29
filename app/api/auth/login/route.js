import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";
import { validateOrigin, rateLimit } from "@/app/lib/security";

/**
 * POST /api/auth/login
 * Sign in with email + password
 */
export async function POST(request) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    const { allowed } = rateLimit({ key: `login:${clientIp}`, maxRequests: 10, windowMs: 300000 });
    if (!allowed) {
      return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || "",
      },
    });
  } catch (error) {
    console.error("[API] /auth/login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
