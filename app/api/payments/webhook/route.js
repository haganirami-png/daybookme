import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req) {
  try {
    const payload = await req.json();
    const supabase = getAdminSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Missing Supabase env" }, { status: 500 });
    }

    // Generic webhook format expected from your payment provider:
    // {
    //   "event": "subscription.active" | "subscription.cancelled" | "payment.failed",
    //   "businessId": "uuid",
    //   "planId": "pro",
    //   "amount": 199,
    //   "currency": "ILS",
    //   "customerId": "...",
    //   "subscriptionId": "..."
    // }
    const event = payload.event || payload.type || "unknown";
    const businessId = payload.businessId || payload.business_id;

    await supabase.from("payment_events").insert({
      business_id: businessId || null,
      provider: process.env.PAYMENT_PROVIDER || "generic",
      event_type: event,
      payload,
    });

    if (businessId && ["subscription.active", "payment.succeeded", "invoice.paid"].includes(event)) {
      await supabase.from("business_subscriptions").insert({
        business_id: businessId,
        plan_id: payload.planId || payload.plan_id || "pro",
        provider: process.env.PAYMENT_PROVIDER || "generic",
        provider_customer_id: payload.customerId || payload.customer_id || null,
        provider_subscription_id: payload.subscriptionId || payload.subscription_id || null,
        amount: payload.amount || null,
        currency: payload.currency || "ILS",
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (businessId && ["subscription.cancelled", "payment.failed", "invoice.payment_failed"].includes(event)) {
      await supabase
        .from("business_subscriptions")
        .update({ status: event.includes("failed") ? "past_due" : "cancelled", updated_at: new Date().toISOString() })
        .eq("business_id", businessId);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("PAYMENT WEBHOOK ERROR:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
