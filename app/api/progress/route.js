import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";
import { createClient } from "@/app/lib/supabase/server";

/**
 * GET /api/progress?analysisId=xxx
 * Fetch user's progress entries for the 30-day challenge
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("analysisId");

    const query = supabase
      .from("progress_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("day_number", { ascending: true });

    if (analysisId) {
      query.eq("analysis_id", analysisId);
    }

    const { data: entries, error } = await query;
    if (error) throw error;

    // Get streak info
    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      entries: entries || [],
      streak: streak || { current_streak: 0, longest_streak: 0, total_check_ins: 0 },
    });
  } catch (error) {
    console.error("[API] /progress GET error:", error);
    return NextResponse.json({ error: "Failed to fetch progress" }, { status: 500 });
  }
}


/**
 * POST /api/progress
 * Log a daily check-in for the 30-day challenge
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { analysisId, dayNumber, checklist, notes } = body;

    if (!dayNumber || dayNumber < 1 || dayNumber > 30) {
      return NextResponse.json({ error: "Invalid day number" }, { status: 400 });
    }

    // Upsert progress entry
    const { data: entry, error } = await supabase
      .from("progress_entries")
      .upsert(
        {
          user_id: user.id,
          analysis_id: analysisId,
          day_number: dayNumber,
          date: new Date().toISOString().split("T")[0],
          checklist: checklist || [],
          notes: notes || "",
        },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (error) throw error;

    // Update streak
    const adminClient = createAdminClient();
    await adminClient.rpc("update_streak", { p_user_id: user.id });

    // Get updated streak
    const { data: streak } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({
      success: true,
      entry,
      streak: streak || { current_streak: 1 },
    });
  } catch (error) {
    console.error("[API] /progress POST error:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
