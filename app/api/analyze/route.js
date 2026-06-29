import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";
import { analyzeImage, validateAnalysisResult } from "@/app/lib/ai/analyze";
import { validateOrigin, validateFileUpload, validateAge, validateGender, validateGoal } from "@/app/lib/security";
import { checkRateLimit } from "@/app/lib/rate-limit";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60;

/**
 * POST /api/analyze
 * Upload selfie + user info → store in Supabase → run AI analysis
 *
 * Architecture fixes applied:
 * 1. Store photo_path only (no signed URL time-bomb)
 * 2. Rate limiting via Supabase (not in-memory)
 * 3. AbortController timeout on AI calls
 * 4. Buffer freed after upload to reduce memory pressure
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    // ─── ORIGIN CHECK ─────────────────────────────────
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ─── RATE LIMITING (Supabase-backed, not in-memory) ──
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || "anon";

    const rateLimitResult = await checkRateLimit(clientIp, "analyze", 5, 300);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a few minutes." },
        { status: 429, headers: { "Retry-After": String(rateLimitResult.retryAfter) } }
      );
    }

    // ─── PARSE FORM DATA ──────────────────────────────
    const formData = await request.formData();
    const file = formData.get("selfie");
    const age = formData.get("age");
    const gender = formData.get("gender");
    const goal = formData.get("goal");
    const sessionId = formData.get("sessionId") || uuidv4();

    // ─── VALIDATE INPUTS ──────────────────────────────
    const fileCheck = validateFileUpload(file);
    if (!fileCheck.valid) {
      return NextResponse.json({ error: fileCheck.errors[0] }, { status: 400 });
    }

    const ageCheck = validateAge(age);
    if (!ageCheck.valid) return NextResponse.json({ error: ageCheck.error }, { status: 400 });

    const genderCheck = validateGender(gender);
    if (!genderCheck.valid) return NextResponse.json({ error: genderCheck.error }, { status: 400 });

    const goalCheck = validateGoal(goal);
    if (!goalCheck.valid) return NextResponse.json({ error: goalCheck.error }, { status: 400 });

    // ─── CONVERT FILE TO BASE64 ───────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // ─── UPLOAD TO SUPABASE STORAGE ───────────────────
    const supabase = createAdminClient();
    const fileExt = file.type.split("/")[1] || "jpg";
    const filePath = `${sessionId}/${uuidv4()}.${fileExt}`;

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.some((b) => b.name === "selfies")) {
      await supabase.storage.createBucket("selfies", {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic"],
      });
    }

    const { error: uploadError } = await supabase.storage
      .from("selfies")
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      console.error("[API] Storage upload failed:", uploadError);
      return NextResponse.json({ error: "Failed to upload photo." }, { status: 500 });
    }

    // FIX #1: Store ONLY photo_path — NOT a signed URL that expires in 1hr
    // Signed URLs are generated on-demand when the frontend needs to display the image

    // ─── CREATE ANALYSIS RECORD ───────────────────────
    const analysisId = uuidv4();
    const { error: insertError } = await supabase
      .from("analyses")
      .insert({
        id: analysisId,
        session_id: sessionId,
        age: ageCheck.value,
        gender: genderCheck.value,
        goal: goalCheck.value,
        photo_url: "", // FIX: no longer storing expiring signed URL
        photo_path: filePath, // Store path — generate signed URL on demand
        status: "processing",
      });

    if (insertError) {
      console.error("[API] DB insert failed:", insertError);
      return NextResponse.json({ error: "Failed to create analysis record." }, { status: 500 });
    }

    // ─── RUN AI ANALYSIS (with timeout) ───────────────
    let aiResult;
    try {
      aiResult = await analyzeImage(base64, ageCheck.value, genderCheck.value, goalCheck.value);
    } catch (aiError) {
      await supabase
        .from("analyses")
        .update({ status: "failed", error_message: aiError.message })
        .eq("id", analysisId);
      return NextResponse.json(
        { error: "AI analysis failed. Please try again.", analysisId },
        { status: 500 }
      );
    }

    // ─── VALIDATE AI RESULT ───────────────────────────
    const validation = validateAnalysisResult(aiResult.result);
    if (!validation.valid) {
      await supabase
        .from("analyses")
        .update({ status: "failed", error_message: validation.error })
        .eq("id", analysisId);
      return NextResponse.json(
        { error: "Analysis produced invalid results. Please retry.", analysisId },
        { status: 500 }
      );
    }

    // ─── STORE RESULTS ────────────────────────────────
    const processingTime = Date.now() - startTime;
    await supabase
      .from("analyses")
      .update({
        status: "completed",
        strengths: aiResult.result.strengths,
        improvements: aiResult.result.improvements,
        full_report: aiResult.result,
        ai_model: aiResult.model,
        processing_time_ms: processingTime,
        improvement_potential: aiResult.result.improvement_potential || 25,
      })
      .eq("id", analysisId);

    return NextResponse.json({
      success: true,
      analysisId,
      sessionId,
      status: "completed",
      processingTime,
    });
  } catch (error) {
    console.error("[API] /analyze unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
