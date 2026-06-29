import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";
import { analyzeImage, validateAnalysisResult } from "@/app/lib/ai/analyze";
import { rateLimit, validateOrigin, validateFileUpload, validateAge, validateGender, validateGoal } from "@/app/lib/security";
import { v4 as uuidv4 } from "uuid";

export const maxDuration = 60; // Allow up to 60s for AI processing

/**
 * POST /api/analyze
 * Upload selfie + user info → store in Supabase → run AI analysis
 */
export async function POST(request) {
  const startTime = Date.now();

  try {
    // ─── ORIGIN CHECK ─────────────────────────────────
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ─── RATE LIMITING ────────────────────────────────
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") || "anon";

    const { allowed, retryAfter } = rateLimit({
      key: `analyze:${clientIp}`,
      maxRequests: 5,
      windowMs: 300000, // 5 per 5 minutes
    });

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
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
    if (!ageCheck.valid) {
      return NextResponse.json({ error: ageCheck.error }, { status: 400 });
    }

    const genderCheck = validateGender(gender);
    if (!genderCheck.valid) {
      return NextResponse.json({ error: genderCheck.error }, { status: 400 });
    }

    const goalCheck = validateGoal(goal);
    if (!goalCheck.valid) {
      return NextResponse.json({ error: goalCheck.error }, { status: 400 });
    }

    // ─── CONVERT FILE TO BASE64 ───────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    // ─── UPLOAD TO SUPABASE STORAGE ───────────────────
    const supabase = createAdminClient();
    const fileExt = file.type.split("/")[1] || "jpg";
    const filePath = `${sessionId}/${uuidv4()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("selfies")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("[API] Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload photo. Please try again." },
        { status: 500 }
      );
    }


    // Get signed URL for the uploaded photo
    const { data: urlData } = await supabase.storage
      .from("selfies")
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    const photoUrl = urlData?.signedUrl || "";

    // ─── CREATE ANALYSIS RECORD (PENDING) ─────────────
    const analysisId = uuidv4();
    const { error: insertError } = await supabase
      .from("analyses")
      .insert({
        id: analysisId,
        session_id: sessionId,
        age: ageCheck.value,
        gender: genderCheck.value,
        goal: goalCheck.value,
        photo_url: photoUrl,
        photo_path: filePath,
        status: "processing",
      });

    if (insertError) {
      console.error("[API] DB insert failed:", insertError);
      return NextResponse.json(
        { error: "Failed to create analysis record." },
        { status: 500 }
      );
    }

    // ─── RUN AI ANALYSIS ──────────────────────────────
    let aiResult;
    try {
      aiResult = await analyzeImage(base64, ageCheck.value, genderCheck.value, goalCheck.value);
    } catch (aiError) {
      // Update status to failed
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
    const { error: updateError } = await supabase
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

    if (updateError) {
      console.error("[API] Failed to store results:", updateError);
    }

    // ─── RETURN RESPONSE ──────────────────────────────
    return NextResponse.json({
      success: true,
      analysisId,
      sessionId,
      status: "completed",
      processingTime,
    });

  } catch (error) {
    console.error("[API] /analyze unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
