import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";

/**
 * GET /api/photo?path=session/uuid.jpg
 * Returns a fresh signed URL for a stored photo
 *
 * FIX: Signed URLs expire after 1 hour. Instead of storing them in the DB,
 * we store only the path and generate fresh signed URLs on demand.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const sessionId = searchParams.get("sessionId");

    if (!path) {
      return NextResponse.json({ error: "Missing path parameter" }, { status: 400 });
    }

    // Basic authorization: path must match session
    if (sessionId && !path.startsWith(sessionId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Generate fresh signed URL valid for 1 hour
    const { data, error } = await supabase.storage
      .from("selfies")
      .createSignedUrl(path, 3600);

    if (error) {
      console.error("[Photo] Signed URL error:", error);
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (error) {
    console.error("[Photo] Error:", error);
    return NextResponse.json({ error: "Failed to get photo URL" }, { status: 500 });
  }
}
