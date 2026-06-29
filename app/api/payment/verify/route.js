import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";
import { validateOrigin } from "@/app/lib/security";
import crypto from "crypto";

/**
 * POST /api/payment/verify
 * Verify Razorpay payment signature and unlock report
 */
export async function POST(request) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sessionId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing payment verification fields" },
        { status: 400 }
      );
    }

    // ─── VERIFY SIGNATURE ─────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed - invalid signature" },
        { status: 400 }
      );
    }


    // ─── UPDATE PAYMENT RECORD ────────────────────────
    const supabase = createAdminClient();

    const { data: payment, error: fetchError } = await supabase
      .from("payments")
      .update({
        razorpay_payment_id,
        razorpay_signature,
        status: "captured",
        updated_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .select("*, analysis_id")
      .single();

    if (fetchError || !payment) {
      console.error("[Payment] Update failed:", fetchError);
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    // ─── SEND CONFIRMATION EMAIL (async, don't block) ─
    try {
      const { sendReportEmail } = await import("@/app/lib/email");
      const email = payment.notes?.email;
      if (email) {
        sendReportEmail({
          to: email,
          name: payment.notes?.name || "",
          analysisId: payment.analysis_id,
        }).catch((e) => console.error("[Email] Send failed:", e));
      }
    } catch (e) {
      console.error("[Email] Import/send error:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      analysisId: payment.analysis_id,
      plan: payment.plan,
    });
  } catch (error) {
    console.error("[API] /payment/verify error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}
