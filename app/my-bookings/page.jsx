"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const accent = "#7c3aed";
const S = {
  app: { fontFamily: "Heebo, Arial, sans-serif", direction: "rtl", background: "#f4f3ff", minHeight: "100vh", maxWidth: 430, margin: "0 auto" },
  header: { background: `linear-gradient(135deg,${accent},#4f46e5)`, padding: "52px 20px 20px", color: "white" },
  card: { background: "white", borderRadius: 14, padding: "14px", marginBottom: 10, border: "1px solid #ede9fe" },
  btn: { border: 0, borderRadius: 12, padding: "11px 16px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  primary: { background: `linear-gradient(135deg,${accent},#4f46e5)`, color: "white" },
  ghost: { background: "#f3f4f6", color: "#374151" },
  input: { width: "100%", padding: "13px 14px", border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: 15, fontFamily: "inherit", direction: "ltr", boxSizing: "border-box", outline: "none" },
  tab: (a) => ({ flex: 1, padding: "12px 4px", textAlign: "center", fontSize: 13, fontWeight: a ? 800 : 600, color: a ? accent : "#9ca3af", borderBottom: a ? `2px solid ${accent}` : "2px solid transparent", cursor: "pointer", background: "transparent", border: "none", fontFamily: "inherit" }),
};

export default function MyBookings() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [appts, setAppts] = useState([]);
  const [section, setSection] = useState("upcoming");
  const [loading, setLoading] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("clientPhone");
    if (saved) { setPhone(saved); setLoggedIn(true); loadAppts(saved); }
  }, []);

  async function loadAppts(p) {
    const { data } = await supabase.from("appointments").select("*").eq("client_phone", p || phone).order("created_at", { ascending: false });
    setAppts(data || []);
  }

  function sendOtp() {
    if (phone.length < 9) return alert("נא להזין מספר טלפון תקין");
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtpCode(code);
    setOtpSent(true);
    alert(`קוד האימות שלך: ${code}`);
  }

  function verifyOtp() {
    if (otp.trim() !== otpCode) return alert("קוד לא נכון");
    localStorage.setItem("clientPhone", phone);
    setLoggedIn(true);
    loadAppts(phone);
  }

  async function cancelAppt(id) {
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    setAppts(p => p.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
    setCancelId(null);
  }

  if (!mounted) return null;

  const filtered = appts.filter(a => a.status === section);

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }} onClick={() => router.push("/")}>← חזור</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 900 }}>📋 התורים שלי</div>
            {loggedIn && <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{phone}</div>}
          </div>
          <div style={{ width: 60 }} />
        </div>
      </div>

      {!loggedIn ? (
        <div style={{ padding: "24px 20px" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>הכנס מספר טלפון</div>
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>נשלח קוד אימות לצפייה בתורים שלך</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="050-0000000" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} />
            <button style={{ ...S.btn, ...S.primary, flexShrink: 0 }} onClick={sendOtp} disabled={otpSent}>{otpSent ? "נשלח ✓" : "שלח קוד"}</button>
          </div>
          {otpSent && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 10 }}>📱 הכנס את הקוד שנשלח</div>
              <input style={{ ...S.input, textAlign: "center", fontSize: 22, letterSpacing: 8, marginBottom: 12 }} placeholder="______" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
              <button style={{ ...S.btn, ...S.primary, width: "100%" }} onClick={verifyOtp}>✅ אמת וכנס</button>
            </div>
          )}
          <button style={{ ...S.btn, ...S.ghost, width: "100%", marginTop: 10 }} onClick={() => router.push("/")}>← חזור לדף הבית</button>
        </div>
      ) : (
        <>
          <div style={{ background: "white", display: "flex", borderBottom: "2px solid #f3f4f6" }}>
            {[{ id: "upcoming", label: "⏳ קרובים" }, { id: "confirmed", label: "✅ מאושרים" }, { id: "cancelled", label: "❌ בוטלו" }].map(t => (
              <button key={t.id} style={S.tab(section === t.id)} onClick={() => setSection(t.id)}>{t.label}</button>
            ))}
          </div>

          <div style={{ padding: "16px 16px 80px" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
                <div style={{ fontSize: 48 }}>📭</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginTop: 12 }}>אין תורים כאן</div>
                <button style={{ ...S.btn, ...S.primary, marginTop: 16 }} onClick={() => router.push("/")}>＋ קבע תור עכשיו</button>
              </div>
            ) : filtered.map(a => (
              <div key={a.id} style={{ ...S.card, borderRight: `4px solid ${section === "cancelled" ? "#ef4444" : section === "confirmed" ? "#10b981" : accent}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b" }}>{a.service}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: accent }}>₪{a.price || ""}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
                  {[{ l: "📅 תאריך", v: a.date }, { l: "⏰ שעה", v: String(a.time || "").slice(0, 5) }, { l: "⏱ משך", v: `${a.duration || ""}′` }].map((s, i) => (
                    <div key={i} style={{ background: "#f9f7ff", borderRadius: 10, padding: "8px", textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600 }}>{s.l}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#1e1b4b", marginTop: 2 }}>{s.v}</div>
                    </div>
                  ))}
                </div>
                {a.notes && <div style={{ fontSize: 12, color: "#a78bfa", marginBottom: 8, fontStyle: "italic" }}>💬 {a.notes}</div>}
                {section !== "cancelled" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ ...S.btn, background: "#fee2e2", color: "#dc2626", flex: 1 }} onClick={() => setCancelId(a.id)}>✕ בטל תור</button>
                  </div>
                )}
                {section === "cancelled" && (
                  <button style={{ ...S.btn, ...S.primary, width: "100%" }} onClick={() => router.push("/")}>🔄 קבע מחדש</button>
                )}
              </div>
            ))}
            <button style={{ ...S.btn, background: "white", color: accent, border: `2px solid ${accent}`, width: "100%", marginTop: 8 }} onClick={() => router.push("/")}>＋ הוסף תור נוסף</button>
          </div>

          {cancelId && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
              <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "24px 20px 36px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "0 auto 18px" }} />
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", textAlign: "center", marginBottom: 6 }}>ביטול תור</div>
                <div style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 24 }}>האם אתה בטוח שברצונך לבטל?</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ ...S.btn, ...S.ghost, flex: 1 }} onClick={() => setCancelId(null)}>חזור</button>
                  <button style={{ flex: 1, background: "#fee2e2", color: "#dc2626", border: "none", borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }} onClick={() => cancelAppt(cancelId)}>✕ בטל תור</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
