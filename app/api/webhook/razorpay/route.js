import { NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase/server";
import {
  claimWebhookEvent,
  finalizeWebhookEvent,
  updateSubscriptionStatus,
  recordSubscriptionPayment,
  mapRazorpaySubscriptionStatus,
  epochToIso,
} from "@/app/lib/subscriptions";
import crypto from "crypto";

/**
 * POST /api/webhook/razorpay
 *
 * Server-to-server confirmation of Razorpay events. This is the AUTHORITATIVE
 * source of subscription state transitions (spec §18). Every event is:
 *   1. signature-verified,
 *   2. idempotency-claimed via the webhook_events ledger (spec §19),
 *   3. processed to update subscriptions / payments,
 *   4. finalized (processed / failed / ignored).
 *
 * Handles subscription lifecycle events plus legacy one-time order events for
 * backward compatibility with any in-flight orders.
 */

function verifySignature(rawBody, signature) {
  // Prefer a dedicated webhook secret; fall back to the key secret so existing
  // deployments keep working until RAZORPAY_WEBHOOK_SECRET is configured.
  const webhookSecret =
    process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret) return false;

  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");
    const providerEventId = request.headers.get("x-razorpay-event-id");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }
    if (!verifySignature(rawBody, signature)) {
      console.error("[Webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const supabase = createAdminClient();

    // Extract common identifiers for the idempotency ledger.
    const subEntity = event.payload?.subscription?.entity;
    const payEntity = event.payload?.payment?.entity;

    // ─── Idempotency claim (spec §19) ─────────────────
    const { duplicate, eventRow, error: claimError } = await claimWebhookEvent(
      supabase,
      {
        providerEventId,
        eventType,
        providerPaymentId: payEntity?.id,
        providerSubscriptionId: subEntity?.id,
        payload: event,
      }
    );

    if (duplicate) {
      // Already processed — return 200 so Razorpay stops retrying.
      return NextResponse.json({ received: true, message: "Already processed" });
    }
    if (claimError) {
      console.error("[Webhook] Failed to record event:", claimError);
      // Fail loud so Razorpay retries later.
      return NextResponse.json({ error: "Ledger write failed" }, { status: 500 });
    }

    const eventId = eventRow?.id;

    try {
      switch (eventType) {
        // ─── SUBSCRIPTION LIFECYCLE ───────────────────
        case "subscription.authenticated":
        case "subscription.activated":
        case "subscription.charged":
        case "subscription.pending":
        case "subscription.halted":
        case "subscription.paused":
        case "subscription.resumed":
        case "subscription.cancelled":
        case "subscription.completed":
        case "subscription.updated": {
          if (!subEntity?.id) break;

          const status = mapRazorpaySubscriptionStatus(subEntity.status);
          const extra = {
            current_period_start: epochToIso(subEntity.current_start),
            current_period_end: epochToIso(subEntity.current_end),
            cancel_at_period_end: !!subEntity.cancel_at_cycle_end,
          };
          if (status === "canceled") {
            extra.canceled_at =
              epochToIso(subEntity.ended_at) || new Date().toISOString();
          }
          // On a failed-charge state, open a grace window before revoking
          // access (spec §20): keep access until current_period_end.
          if (status === "past_due" || status === "payment_failed") {
            extra.grace_period_end = epochToIso(subEntity.current_end);
          }

          const result = await updateSubscriptionStatus(supabase, {
            providerSubscriptionId: subEntity.id,
            status,
            extra,
          });

          if (result.notFound) {
            // We don't have this subscription locally (e.g. created outside our
            // flow). Log and ignore rather than error.
            console.warn(
              "[Webhook] No local subscription for",
              subEntity.id
            );
          }

          // On a successful recurring charge, record the renewal payment.
          if (eventType === "subscription.charged" && payEntity?.id) {
            await recordSubscriptionPayment(supabase, {
              userId: result.subscription?.user_id,
              subscriptionId: result.subscription?.id,
              planKey: result.subscription?.plan || "pro_monthly",
              razorpayPaymentId: payEntity.id,
              razorpaySubscriptionId: subEntity.id,
              razorpayInvoiceId: event.payload?.invoice?.entity?.id,
              amount: payEntity.amount,
              status: "paid",
              billingReason: "renewal",
            });
          }
          break;
        }

        // ─── LEGACY ONE-TIME ORDER EVENTS (backward compat) ─
        case "payment.captured": {
          const payment = payEntity;
          if (!payment?.order_id) break;
          const { data: existing } = await supabase
            .from("payments")
            .select("status")
            .eq("razorpay_order_id", payment.order_id)
            .maybeSingle();
          if (existing?.status === "captured") break;
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
          const payment = payEntity;
          if (!payment?.order_id) break;
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
          const refund = event.payload?.refund?.entity;
          if (!refund?.payment_id) break;
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
          await finalizeWebhookEvent(supabase, eventId, "ignored");
          return NextResponse.json({ received: true, message: "Unhandled event" });
      }

      await finalizeWebhookEvent(supabase, eventId, "processed");
      return NextResponse.json({ received: true });
    } catch (procErr) {
      console.error("[Webhook] Processing error:", procErr);
      await finalizeWebhookEvent(
        supabase,
        eventId,
        "failed",
        String(procErr?.message || procErr)
      );
      // 500 so Razorpay retries (idempotency guard makes retries safe).
      return NextResponse.json(
        { error: "Webhook processing failed" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Webhook] Error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
