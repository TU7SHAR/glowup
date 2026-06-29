import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";
import crypto from "crypto";

/**
 * POST /api/webhook/razorpay
 * Handles Razorpay webhook events (payment.captured, payment.failed, refund)
 * This is the server-to-server confirmation (more reliable than client verify)
 */
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_KEY_SECRET;
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const supabase = createAdminClient();

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity;
        await supabase
          .from("payments")
          .update({
            status: "captured",
            razorpay_payment_id: payment.id,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", payment.order_id);
        break;
      }


      case "payment.failed": {
        const payment = event.payload.payment.entity;
        await supabase
          .from("payments")
          .update({
            status: "failed",
            razorpay_payment_id: payment.id,
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_order_id", payment.order_id);
        break;
      }

      case "refund.created": {
        const refund = event.payload.refund.entity;
        await supabase
          .from("payments")
          .update({
            status: "refunded",
            updated_at: new Date().toISOString(),
          })
          .eq("razorpay_payment_id", refund.payment_id);
        break;
      }

      default:
        console.log("[Webhook] Unhandled event:", event.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
