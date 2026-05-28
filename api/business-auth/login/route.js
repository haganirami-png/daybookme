import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}
function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const candidate = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(candidate, "hex"));
}
function token() { return crypto.randomBytes(32).toString("hex"); }

export async function POST(req) {
  try {
    const { phone, password } = await req.json();
    const supabase = admin();
    if (!supabase) return NextResponse.json({ error: "Missing Supabase env" }, { status: 500 });
    if (!phone || !password) return NextResponse.json({ error: "Missing phone/password" }, { status: 400 });

    const { data: user, error } = await supabase.from("business_users").select("*").eq("phone", phone).eq("is_active", true).maybeSingle();
    if (error || !user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: "טלפון או סיסמה לא נכונים" }, { status: 401 });
    }
    const sessionToken = token();
    await supabase.from("business_users").update({ session_token: sessionToken, session_created_at: new Date().toISOString() }).eq("id", user.id);
    const { data: business } = await supabase.from("businesses").select("*").eq("id", user.business_id).single();
    return NextResponse.json({ business, token: sessionToken });
  } catch (e) {
    console.error("BUSINESS LOGIN ERROR", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
