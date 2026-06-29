import { NextResponse } from "next/server";

/**
 * GET /api/health
 * Health check endpoint for monitoring
 */
export async function GET() {
  const envStatus = {
    supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    ai: !!(process.env.OPENAI_API_KEY || process.env.GOOGLE_AI_API_KEY),
    payment: !!process.env.RAZORPAY_KEY_ID,
  };

  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    services: envStatus,
  });
}
