import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";
import { validateOrigin, rateLimit } from "@/app/lib/security";
import Razorpay from "razorpay";
import { v4 as uuidv4 } from "uuid";

const PLAN_PRICES = {
  report: 19900,   // ₹199 in paise
  coach: 49900,    // ₹499 in paise
  monthly: 99900,  // ₹999 in paise
};

/**
 * POST /api/payment/create
 * Create a Razorpay order for the selected plan
 */
export async function POST(request) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
    const { allowed } = rateLimit({
      key: `payment:${clientIp}`,
      maxRequests: 10,
      windowMs: 60000,
    });
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { plan, analysisId, sessionId, email, name } = body;

    // Validate plan
    if (!PLAN_PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }
    if (!analysisId || !sessionId) {
      return NextResponse.json(
        { error: "Missing analysisId or sessionId" },
        { status: 400 }
      );
    }


    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create Razorpay order
    const amount = PLAN_PRICES[plan];
    const receipt = `glowup_${uuidv4().slice(0, 8)}`;

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt,
      notes: {
        plan,
        analysisId,
        sessionId,
        email: email || "",
        name: name || "",
      },
    });

    // Store payment record in DB
    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from("payments").insert({
      session_id: sessionId,
      analysis_id: analysisId,
      razorpay_order_id: order.id,
      amount,
      currency: "INR",
      plan,
      status: "created",
      receipt,
      notes: { email, name },
    });

    if (dbError) {
      console.error("[Payment] DB insert error:", dbError);
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount,
      currency: "INR",
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: "GlowUp AI",
      description: `GlowUp AI - ${plan === "report" ? "Glow-Up Report" : plan === "coach" ? "30-Day Coach" : "Monthly Premium"}`,
    });
  } catch (error) {
    console.error("[API] /payment/create error:", error);
    return NextResponse.json(
      { error: "Failed to create payment order" },
      { status: 500 }
    );
  }
}
