import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PLANS = {
  starter: { name: "Starter", amount: 99, currency: "ILS", interval: "monthly" },
  pro: { name: "Pro", amount: 199, currency: "ILS", interval: "monthly" },
  premium: { name: "Premium", amount: 349, currency: "ILS", interval: "monthly" },
};

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

export async function POST(req) {
  try {
    const { businessId, planId } = await req.json();
    const plan = PLANS[planId];

    if (!businessId || !plan) {
      return NextResponse.json(
        { error: "Missing businessId or invalid planId" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    if (!supabase) {
      return NextResponse.json(
        { error: "Missing Supabase environment variables" },
        { status: 500 }
      );
    }

    const provider = process.env.PAYMENT_PROVIDER || "demo";

    /*
      DEMO MODE:
      This activates the selected plan immediately without real payment.
      Useful for MVP testing until a real payment provider is connected.
    */
    if (provider === "demo") {
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from("business_subscriptions")
        .insert({
          business_id: businessId,
          plan_id: planId,
          provider: "demo",
          provider_customer_id: `demo_customer_${businessId}`,
          provider_subscription_id: `demo_sub_${Date.now()}`,
          amount: plan.amount,
          currency: plan.currency,
          status: "active",
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          updated_at: now.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("DEMO SUBSCRIPTION ERROR:", error);
        return NextResponse.json(
          { error: error.message || "Could not activate demo subscription" },
          { status: 500 }
        );
      }

      // Important: no checkoutUrl in demo mode.
      // The frontend will stay on the dashboard and reload the subscription.
      return NextResponse.json({
        mode: "demo",
        success: true,
        subscription: data,
      });
    }

    /*
      REAL PAYMENT PROVIDER MODE:
      Use this later when connecting a real checkout provider.
    */
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const providerApiUrl = process.env.PAYMENT_PROVIDER_API_URL;
    const providerSecret = process.env.PAYMENT_PROVIDER_SECRET;

    if (!providerApiUrl || !providerSecret) {
      return NextResponse.json(
        { error: "Missing payment provider env vars" },
        { status: 500 }
      );
    }

    const providerRes = await fetch(providerApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerSecret}`,
      },
      body: JSON.stringify({
        businessId,
        planId,
        planName: plan.name,
        amount: plan.amount,
        currency: plan.currency,
        interval: plan.interval,
        successUrl: `${appUrl}/?payment=success`,
        cancelUrl: `${appUrl}/?payment=cancelled`,
        webhookUrl: `${appUrl}/api/payments/webhook`,
      }),
    });

    const providerData = await providerRes.json().catch(() => ({}));

    if (!providerRes.ok) {
      console.error("PROVIDER CHECKOUT ERROR:", providerData);
      return NextResponse.json(
        { error: "Payment provider error", details: providerData },
        { status: 502 }
      );
    }

    const checkoutUrl =
      providerData.checkoutUrl || providerData.checkout_url || providerData.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Provider did not return checkout URL" },
        { status: 502 }
      );
    }

    await supabase.from("payment_events").insert({
      business_id: businessId,
      provider,
      event_type: "checkout_created",
      payload: providerData,
    });

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    console.error("CREATE CHECKOUT ERROR:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
