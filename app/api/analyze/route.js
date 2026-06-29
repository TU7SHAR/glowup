import { NextResponse } from "next/server";
import {
  rateLimit,
  validateOrigin,
  validateFileUpload,
  validateAge,
  validateGender,
  validateGoal,
} from "@/app/lib/security";

/**
 * POST /api/analyze
 * Accepts selfie upload and user details, triggers AI analysis
 * Protected by rate limiting, origin validation, and input sanitization
 */
export async function POST(request) {
  try {
    // ─── CSRF / ORIGIN CHECK ────────────────────────
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: "Forbidden - invalid origin" },
        { status: 403 }
      );
    }

    // ─── RATE LIMITING ──────────────────────────────
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const { allowed, remaining, retryAfter } = rateLimit({
      key: `analyze:${clientIp}`,
      maxRequests: 5,
      windowMs: 60000, // 5 requests per minute
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // ─── PARSE FORM DATA ────────────────────────────
    const formData = await request.formData();
    const file = formData.get("selfie");
    const age = formData.get("age");
    const gender = formData.get("gender");
    const goal = formData.get("goal");

    // ─── VALIDATE FILE ──────────────────────────────
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: "Invalid file", details: fileValidation.errors },
        { status: 400 }
      );
    }

    // ─── VALIDATE INPUTS ────────────────────────────
    const ageResult = validateAge(age);
    if (!ageResult.valid) {
      return NextResponse.json(
        { error: ageResult.error },
        { status: 400 }
      );
    }

    const genderResult = validateGender(gender);
    if (!genderResult.valid) {
      return NextResponse.json(
        { error: genderResult.error },
        { status: 400 }
      );
    }

    const goalResult = validateGoal(goal);
    if (!goalResult.valid) {
      return NextResponse.json(
        { error: goalResult.error },
        { status: 400 }
      );
    }

    // ─── PROCESS (placeholder for AI integration) ───
    // In production:
    // 1. Upload file to Supabase Storage
    // 2. Call OpenAI/Gemini Vision API
    // 3. Store results in database
    // 4. Return analysis ID

    return NextResponse.json(
      {
        success: true,
        message: "Analysis started",
        analysisId: crypto.randomUUID(),
        data: {
          age: ageResult.value,
          gender: genderResult.value,
          goal: goalResult.value,
        },
      },
      {
        status: 200,
        headers: {
          "X-RateLimit-Remaining": String(remaining),
        },
      }
    );
  } catch (error) {
    console.error("[API] /analyze error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET - Not allowed
 */
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 }
  );
}
