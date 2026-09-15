import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/app/lib/supabase/server";
import { validateOrigin } from "@/app/lib/security";
import { getPlan } from "@/app/lib/plans";
import { recordSubscriptionPayment } from "@/app/lib/subscriptions";
import crypto from "crypto";

/**
 * POST /api/payment/verify
 * Verify a Razorpay *subscription* authorization signature.
 *
 * For subscriptions, Razorpay Checkout returns razorpay_payment_id,
 * razorpay_subscription_id and razorpay_signature. The signature is
 * HMAC-SHA256 of `${razorpay_payment_id}|${razorpay_subscription_id}`
 * (note the order differs from one-time orders).
 *
 * This confirms the user completed authorization. The subscription's ongoing
 * status is ultimately driven by webhooks (spec §18); this route provides
 * immediate UX confirmation and records the initial payment.
 */
export async function POST(request) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = body;

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        { error: "Missing subscription verification fields" },
        { status: 400 }
      );
    }

    // ─── VERIFY SIGNATURE ─────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    // Timing-safe comparison.
    const valid =
      generatedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpay_signature)
      );

    if (!valid) {
      return NextResponse.json(
        { error: "Subscription verification failed - invalid signature" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ─── Look up the local subscription row ───────────
    const { data: subscription } = await admin
      .from("subscriptions")
      .select("*")
      .eq("provider_subscription_id", razorpay_subscription_id)
      .maybeSingle();

    // Confirm ownership: the signed-in user should own this subscription.
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (user && subscription && subscription.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ─── Mark authorized & record the initial payment ─
    if (subscription) {
      await admin
        .from("subscriptions")
        .update({
          // A successful authorization means the mandate is set up. Keep
          // 'trialing' until the first charge webhook flips it to 'active';
          // for immediate-charge plans the webhook will arrive shortly.
          status: subscription.status === "canceled" ? subscription.status : "trialing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", subscription.id);

      const plan = getPlan(subscription.plan);
      await recordSubscriptionPayment(admin, {
        userId: subscription.user_id,
        subscriptionId: subscription.id,
        planKey: subscription.plan,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySubscriptionId: razorpay_subscription_id,
        amount: plan?.amount,
        status: "paid",
        billingReason: "initial",
      });

      // ─── Confirmation email (best effort) ───────────
      try {
        const { sendPaymentConfirmation } = await import("@/app/lib/email");
        const email = subscription.notes?.email || user?.email;
        if (email && plan) {
          sendPaymentConfirmation({
            to: email,
            plan: subscription.plan,
            amount: plan.amount,
          }).catch((e) => console.error("[Email] Send failed:", e));
        }
      } catch (e) {
        console.error("[Email] Import/send error:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Subscription authorized successfully",
      subscriptionId: razorpay_subscription_id,
      plan: subscription?.plan || null,
    });
  } catch (error) {
    console.error("[API] /payment/verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
