"use client";
import { useEffect, useMemo, useState } from "react";
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

function getStatus(appt) {
  if (appt?.status === "cancelled") return "cancelled";
  const dt = new Date(`${appt?.date || ""}T${String(appt?.time || "00:00").slice(0, 5)}:00`);
  if (!Number.isNaN(dt.getTime()) && dt.getTime() < Date.now()) return "completed";
  return "confirmed";
}

function statusText(status) {
  if (status === "cancelled") return "🔴 בוטל";
  if (status === "completed") return "⚫ הסתיים";
  return "🟢 תור מאושר";
}

function nextDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

const EDIT_TIMES = Array.from({ length: 21 }, (_, i) => {
  const mins = 8 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

export default function MyBookings() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [appts, setAppts] = useState([]);
  const [businesses, setBusinesses] = useState({});
  const [section, setSection] = useState("confirmed");
  const [cancelId, setCancelId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("clientPhone");
    if (saved) { setPhone(saved); setLoggedIn(true); loadAppts(saved); }
  }, []);

  async function loadAppts(p) {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("client_phone", p || phone)
      .order("created_at", { ascending: false });

    const rows = data || [];
    setAppts(rows);

    const ids = [...new Set(rows.map(a => a.business_id).filter(Boolean))];
    if (ids.length) {
      const { data: biz } = await supabase
        .from("businesses")
        .select("id,name,phone,slug,address")
        .in("id", ids);

      const map = {};
      (biz || []).forEach(b => { map[b.id] = b; });
      setBusinesses(map);
    }
  }

  // ── TWILIO OTP ──
  async function sendOtp() {
    if (phone.length < 9) return alert("נא להזין מספר טלפון תקין");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "send" }),
      });
      const data = await res.json();
      if (data.ok) {
        setOtpSent(true);
        setOtp("");
      } else {
        alert("שגיאה בשליחת SMS: " + (data.error || "נסה שוב"));
      }
    } catch {
      alert("שגיאה בשליחת SMS");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otp || otp.length < 4) return alert("הכנס את הקוד שנשלח");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, action: "verify", code: String(otp).replace(/\s/g, "") }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem("clientPhone", phone);
        setLoggedIn(true);
        loadAppts(phone);
      } else {
        alert("קוד לא נכון, נסה שוב");
      }
    } catch {
      alert("שגיאה באימות");
    } finally {
      setOtpLoading(false);
    }
  }

  async function cancelAppt(id) {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) return alert("שגיאה בביטול התור");
    setAppts(p => p.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
    setCancelId(null);
  }

  function openEdit(appt) {
    setEditAppt(appt);
    setEditDate(appt.date || nextDates()[0]);
    setEditTime(String(appt.time || "09:00").slice(0, 5));
  }

  async function saveEdit() {
    if (!editAppt || !editDate || !editTime) return alert("בחר תאריך ושעה");
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from("appointments")
        .update({ date: editDate, time: editTime, status: "confirmed" })
        .eq("id", editAppt.id);

      if (error) throw error;

      setAppts(p => p.map(a => a.id === editAppt.id ? { ...a, date: editDate, time: editTime, status: "confirmed" } : a));
      setEditAppt(null);
    } catch (e) {
      alert("שגיאה בשינוי התור");
    } finally {
      setEditLoading(false);
    }
  }

  if (!mounted) return null;
  const filtered = useMemo(() => appts.filter(a => getStatus(a) === section), [appts, section]);

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
          <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 20 }}>נשלח קוד SMS לאימות</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input style={{ ...S.input, flex: 1 }} placeholder="050-0000000" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} />
            <button style={{ ...S.btn, ...S.primary, flexShrink: 0 }} onClick={sendOtp} disabled={otpSent || otpLoading}>
              {otpLoading ? "..." : otpSent ? "נשלח ✓" : "שלח קוד"}
            </button>
          </div>
          {otpSent && (
            <div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10, textAlign: "center" }}>📱 הכנס את הקוד שנשלח ל-{phone}</div>
              <input style={{ ...S.input, textAlign: "center", fontSize: 22, letterSpacing: 8, marginBottom: 12 }} placeholder="000000" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
              <button style={{ ...S.btn, ...S.primary, width: "100%" }} onClick={verifyOtp} disabled={otpLoading}>
                {otpLoading ? "מאמת..." : "✅ אמת וכנס"}
              </button>
            </div>
          )}
          <button style={{ ...S.btn, ...S.ghost, width: "100%", marginTop: 10 }} onClick={() => router.push("/")}>← חזור לדף הבית</button>
        </div>
      ) : (
        <>
          <div style={{ background: "white", display: "flex", borderBottom: "2px solid #f3f4f6" }}>
            {[{ id: "confirmed", label: "✅ מאושרים" }, { id: "cancelled", label: "❌ בוטלו" }, { id: "completed", label: "⚫ הסתיימו" }].map(t => (
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
              <div key={a.id} style={{ ...S.card, borderRight: `4px solid ${getStatus(a) === "cancelled" ? "#ef4444" : getStatus(a) === "completed" ? "#6b7280" : "#10b981"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b" }}>{a.service}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: accent }}>₪{a.price || ""}</div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 700 }}>🏪 {businesses[a.business_id]?.name || a.business || "עסק"}</div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: getStatus(a) === "cancelled" ? "#dc2626" : getStatus(a) === "completed" ? "#6b7280" : "#059669" }}>{statusText(getStatus(a))}</div>
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
                {getStatus(a) === "confirmed" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button style={{ ...S.btn, background: "#eef2ff", color: accent }} onClick={() => openEdit(a)}>🔄 שנה תור</button>
                    <button style={{ ...S.btn, background: "#fee2e2", color: "#dc2626" }} onClick={() => setCancelId(a.id)}>✕ בטל תור</button>
                    {businesses[a.business_id]?.phone && (
                      <button style={{ ...S.btn, ...S.ghost, gridColumn: "1 / -1" }} onClick={() => window.location.href = `tel:${businesses[a.business_id].phone}`}>📞 צור קשר עם העסק</button>
                    )}
                  </div>
                )}
                {getStatus(a) === "cancelled" && (
                  <button style={{ ...S.btn, ...S.primary, width: "100%" }} onClick={() => router.push(`/book?business_id=${a.business_id || ""}`)}>🔄 קבע מחדש</button>
                )}
                {getStatus(a) === "completed" && (
                  <button style={{ ...S.btn, ...S.primary, width: "100%" }} onClick={() => router.push(`/book?business_id=${a.business_id || ""}`)}>＋ קבע שוב</button>
                )}
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                style={{
                  ...S.btn,
                  background: "white",
                  color: accent,
                  border: `2px solid ${accent}`,
                  flex: 1
                }}
                onClick={() => router.push("/")}
              >
                🏠 מסך הבית
              </button>

              <button
                style={{
                  ...S.btn,
                  ...S.primary,
                  flex: 1
                }}
                onClick={() => router.push("/")}
              >
                ＋ הוסף תור נוסף
              </button>
            </div>
          </div>

          {editAppt && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
              <div style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "24px 20px 36px" }}>
                <div style={{ width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "0 auto 18px" }} />
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1b4b", textAlign: "center", marginBottom: 6 }}>שינוי תור</div>
                <div style={{ fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 18 }}>{editAppt.service}</div>

                <div style={{ fontSize: 13, fontWeight: 900, color: "#374151", marginBottom: 8 }}>בחר תאריך חדש</div>
                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
                  {nextDates().map(d => (
                    <button key={d} style={{ ...S.btn, flexShrink: 0, ...(editDate === d ? S.primary : S.ghost) }} onClick={() => setEditDate(d)}>{d.slice(5).replace("-", "/")}</button>
                  ))}
                </div>

                <div style={{ fontSize: 13, fontWeight: 900, color: "#374151", marginBottom: 8 }}>בחר שעה חדשה</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, maxHeight: 210, overflowY: "auto", marginBottom: 18 }}>
                  {EDIT_TIMES.map(t => (
                    <button key={t} style={{ ...S.btn, ...(editTime === t ? S.primary : S.ghost) }} onClick={() => setEditTime(t)}>{t}</button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button style={{ ...S.btn, ...S.ghost, flex: 1 }} onClick={() => setEditAppt(null)}>חזור</button>
                  <button style={{ ...S.btn, ...S.primary, flex: 1 }} onClick={saveEdit} disabled={editLoading}>{editLoading ? "שומר..." : "✅ שמור שינוי"}</button>
                </div>
              </div>
            </div>
          )}

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
