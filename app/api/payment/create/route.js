import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/app/lib/supabase/server";
import { validateOrigin, rateLimit } from "@/app/lib/security";
import { getPlan, PLAN_KEYS } from "@/app/lib/plans";
import {
  getRazorpayClient,
  getRazorpayPlanId,
  upsertSubscriptionFromRazorpay,
} from "@/app/lib/subscriptions";

/**
 * POST /api/payment/create
 * Create a Razorpay *Subscription* (recurring) for the selected plan.
 *
 * Subscriptions attach to a user account, so this route requires an
 * authenticated Supabase user (spec §17/§44). The returned subscription id is
 * handed to Razorpay Checkout on the client.
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
    const { plan: planKey, analysisId } = body;

    // ─── Validate plan ────────────────────────────────
    const plan = getPlan(planKey);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const razorpayPlanId = getRazorpayPlanId(planKey);
    if (!razorpayPlanId) {
      console.error(`[Payment] Missing Razorpay plan id for ${planKey}`);
      return NextResponse.json(
        { error: "This plan is not available yet. Please try again later." },
        { status: 503 }
      );
    }

    // ─── Require an authenticated user ────────────────
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to start your subscription.", code: "auth_required" },
        { status: 401 }
      );
    }

    // ─── Create the Razorpay subscription ─────────────
    const razorpay = getRazorpayClient();

    // total_count: how many billing cycles Razorpay should attempt before
    // marking the subscription complete. We use a large horizon so it keeps
    // renewing until the customer cancels.
    const totalCount = planKey === PLAN_KEYS.PRO_ANNUAL ? 10 : 120;

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: totalCount,
      customer_notify: 1,
      notes: {
        glowup_plan_key: planKey,
        user_id: user.id,
        analysis_id: analysisId || "",
      },
    });

    // ─── Mirror it locally (source of truth for access) ─
    const admin = createAdminClient();
    const { error: dbError } = await upsertSubscriptionFromRazorpay(admin, {
      userId: user.id,
      planKey,
      razorpaySubscription: subscription,
    });
    if (dbError) {
      console.error("[Payment] Subscription upsert error:", dbError);
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      name: "GlowUp AI",
      description: `GlowUp AI — ${plan.name} (${plan.intervalLabel})`,
      plan: planKey,
      amount: plan.amount,
      currency: plan.currency,
    });
  } catch (error) {
    console.error("[API] /payment/create error:", error);
    return NextResponse.json(
      { error: "Failed to start subscription" },
      { status: 500 }
    );
  }
}
