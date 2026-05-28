import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(req) {
  try {
    const { phone, action, code } = await req.json();

    // נקה את המספר
    const cleaned = String(phone).replace(/\D/g, "");
    const formatted = cleaned.startsWith("0")
      ? `+972${cleaned.slice(1)}`
      : `+${cleaned}`;

    if (action === "send") {
      await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID)
        .verifications.create({
          to: formatted,
          channel: "sms",
        });
      return NextResponse.json({ ok: true });
    }

    if (action === "verify") {
      const result = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID)
        .verificationChecks.create({
          to: formatted,
          code: String(code).replace(/\s/g, ""),
        });
      return NextResponse.json({ ok: result.status === "approved" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    console.error("OTP ERROR:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}