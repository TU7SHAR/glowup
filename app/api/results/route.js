import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";

/**
 * GET /api/results?id=analysisId&sessionId=xxx
 * Fetch analysis results (free = strengths only, paid = full)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("id");
    const sessionId = searchParams.get("sessionId");

    if (!analysisId || !sessionId) {
      return NextResponse.json(
        { error: "Missing id or sessionId" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the analysis
    const { data: analysis, error } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", analysisId)
      .eq("session_id", sessionId)
      .single();

    if (error || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }


    // Check if user has paid
    const { data: payment } = await supabase
      .from("payments")
      .select("id, plan, status")
      .eq("analysis_id", analysisId)
      .eq("status", "captured")
      .single();

    const isPaid = !!payment;
    const plan = payment?.plan || null;

    // Build response based on payment status
    const response = {
      id: analysis.id,
      status: analysis.status,
      createdAt: analysis.created_at,
      isPaid,
      plan,
    };

    if (analysis.status === "pending" || analysis.status === "processing") {
      return NextResponse.json({ ...response, message: "Analysis in progress" });
    }

    if (analysis.status === "failed") {
      return NextResponse.json(
        { ...response, error: analysis.error_message || "Analysis failed" },
        { status: 500 }
      );
    }

    // FREE tier: show strengths + improvement count
    response.strengths = analysis.strengths;
    response.improvementCount = (analysis.improvements || []).length;
    response.improvementPotential = analysis.improvement_potential;
    response.overallVibe = analysis.full_report?.overall_vibe;

    // PAID tier: full report
    if (isPaid) {
      response.improvements = analysis.improvements;
      response.fullReport = analysis.full_report;
      response.aiPreviewUrl = analysis.ai_preview_url;
    } else {
      // Show locked teasers (category + label only)
      response.lockedImprovements = (analysis.improvements || []).map((imp) => ({
        category: imp.category,
        label: imp.label,
        impact: imp.impact,
      }));
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[API] /results error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
