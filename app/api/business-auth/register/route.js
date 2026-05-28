import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
function token() { return crypto.randomBytes(32).toString("hex"); }

export async function POST(req) {
  try {
    const body = await req.json();
    const supabase = admin();
    if (!supabase) return NextResponse.json({ error: "Missing Supabase env" }, { status: 500 });
    if (!body.name || !body.phone || !body.password || body.password.length < 6) {
      return NextResponse.json({ error: "Missing name/phone/password" }, { status: 400 });
    }

    const slugBase = body.slug || body.name.toLowerCase().replace(/[^a-z0-9א-ת]+/gi, "-");
    const slug = `${slugBase}`.replace(/^-|-$/g, "") || `business-${Date.now()}`;

    const { data: business, error: bizErr } = await supabase
  .from("businesses")
  .insert({
    name: body.name,
    slug,
    phone: body.phone,
    address: body.address || "",
    status: "active",
  })
  .select()
  .single();
    const sessionToken = token();
    const { error: userErr } = await supabase.from("business_users").insert({
      business_id: business.id,
      phone: body.phone,
      name: body.owner_name || body.name,
      role: "owner",
      password_hash: hashPassword(body.password),
      session_token: sessionToken,
      session_created_at: new Date().toISOString(),
    });
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 400 });

    const defaults = [
      { business_id: business.id, name: "תספורת", duration: 45, price: 120, emoji: "✂️" },
      { business_id: business.id, name: "צבע שיער", duration: 90, price: 280, emoji: "🎨" },
      { business_id: business.id, name: "טיפול פנים", duration: 60, price: 200, emoji: "💆" },
    ];
    await supabase.from("business_services").insert(defaults);
    await supabase.from("business_availability").insert([0,1,2,3,4,5,6].map(d => ({
      business_id: business.id, day_of_week: d, is_open: d !== 6, start_time: "09:00", end_time: d === 5 ? "14:00" : "18:00", slot_minutes: 30
    })));

    return NextResponse.json({ business, token: sessionToken });
  } catch (e) {
    console.error("BUSINESS REGISTER ERROR", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
