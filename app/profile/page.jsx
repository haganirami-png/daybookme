"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const accent = "#7c3aed";
const S = {
  app: { fontFamily: "Heebo, Arial, sans-serif", direction: "rtl", background: "#f4f3ff", minHeight: "100vh", maxWidth: 430, margin: "0 auto" },
  header: { background: `linear-gradient(135deg,${accent},#4f46e5)`, padding: "52px 20px 28px", color: "white", textAlign: "center" },
  card: { background: "white", borderRadius: 14, padding: "16px", marginBottom: 12, border: "1px solid #ede9fe" },
  btn: { border: 0, borderRadius: 12, padding: "11px 16px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  primary: { background: `linear-gradient(135deg,${accent},#4f46e5)`, color: "white" },
  ghost: { background: "#f3f4f6", color: "#374151" },
  input: { width: "100%", padding: "13px 14px", border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: 15, fontFamily: "inherit", direction: "ltr", boxSizing: "border-box", outline: "none" },
};

export default function Profile() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [savedPhone, setSavedPhone] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [appts, setAppts] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("clientPhone");
    if (saved) { setSavedPhone(saved); setPhone(saved); setLoggedIn(true); loadData(saved); }
    try { setFavorites(JSON.parse(localStorage.getItem("clientFavorites") || "[]")); } catch {}
  }, []);

  async function loadData(p) {
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
    setSavedPhone(phone);
    setLoggedIn(true);
    loadData(phone);
  }

  function logout() {
    localStorage.removeItem("clientPhone");
    localStorage.removeItem("otpVerified");
    localStorage.removeItem("loggedIn");
    setLoggedIn(false);
    setSavedPhone("");
    setPhone("");
    setAppts([]);
  }

  if (!mounted) return null;

  const upcoming = appts.filter(a => ["upcoming", "confirmed", "pending"].includes(a.status)).length;
  const done = appts.filter(a => a.status === "done").length;

  return (
    <div style={S.app}>
      {loggedIn ? (
        <>
          <div style={S.header}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 12px" }}>👤</div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>{savedPhone}</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>לקוח רשום</div>
          </div>

          <div style={{ padding: "16px 16px 80px" }}>
            {/* STATS */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[{ v: upcoming, l: "תורים קרובים" }, { v: done, l: "ביקורים" }, { v: favorites.length, l: "מועדפים" }].map((s, i) => (
                <div key={i} style={{ background: "white", borderRadius: 14, padding: "12px 8px", textAlign: "center", border: "1px solid #ede9fe" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: accent }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* QUICK ACTIONS */}
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", marginBottom: 12 }}>פעולות מהירות</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button style={{ ...S.btn, ...S.ghost, textAlign: "right", width: "100%" }} onClick={() => router.push("/my-bookings")}>📅 התורים שלי</button>
                <button style={{ ...S.btn, ...S.ghost, textAlign: "right", width: "100%" }} onClick={() => router.push("/favorites")}>❤️ המועדפים שלי</button>
                <button style={{ ...S.btn, ...S.ghost, textAlign: "right", width: "100%" }} onClick={() => router.push("/")}>🔍 חפש עסקים</button>
              </div>
            </div>

            {/* RECENT APPTS */}
            {appts.length > 0 && (
              <div style={S.card}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", marginBottom: 12 }}>תורים אחרונים</div>
                {appts.slice(0, 3).map(a => (
                  <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#1e1b4b" }}>{a.service}</div>
                      <div style={{ fontSize: 11, color: "#9ca3af" }}>{a.date} · {String(a.time || "").slice(0, 5)}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: a.status === "cancelled" ? "#ef4444" : a.status === "confirmed" ? "#10b981" : accent }}>{a.status}</div>
                  </div>
                ))}
                <button style={{ ...S.btn, ...S.primary, width: "100%", marginTop: 10 }} onClick={() => router.push("/my-bookings")}>כל התורים</button>
              </div>
            )}

            {/* LOGOUT */}
            <button style={{ ...S.btn, background: "#fee2e2", color: "#dc2626", width: "100%" }} onClick={logout}>
              🚪 התנתקות
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={S.header}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
            <div style={{ fontSize: 20, fontWeight: 900 }}>הפרופיל שלי</div>
            <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>התחבר לצפייה בתורים ומועדפים</div>
          </div>

          <div style={{ padding: "24px 20px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e1b4b", marginBottom: 6 }}>מספר טלפון</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input style={{ ...S.input, flex: 1 }} placeholder="050-0000000" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} />
              <button style={{ ...S.btn, ...S.primary, flexShrink: 0 }} onClick={sendOtp} disabled={otpSent}>{otpSent ? "נשלח ✓" : "שלח קוד"}</button>
            </div>
            {otpSent && (
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#1e1b4b" }}>📱 הכנס את הקוד שנשלח</div>
                <input style={{ ...S.input, textAlign: "center", fontSize: 22, letterSpacing: 8, marginBottom: 12 }} placeholder="______" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} />
                <button style={{ ...S.btn, ...S.primary, width: "100%" }} onClick={verifyOtp}>✅ כניסה</button>
              </div>
            )}
            <button style={{ ...S.btn, ...S.ghost, width: "100%", marginTop: 10 }} onClick={() => router.push("/")}>← חזור לדף הבית</button>
          </div>
        </>
      )}

      {/* BOTTOM NAV */}
      <BottomNav active="profile" />
    </div>
  );
}

function BottomNav({ active }) {
  const router = useRouter();
  const items = [
    { id: "home", icon: "🏠", label: "בית", path: "/" },
    { id: "favorites", icon: "❤️", label: "מועדפים", path: "/favorites" },
    { id: "bookings", icon: "📅", label: "תורים", path: "/my-bookings" },
    { id: "profile", icon: "👤", label: "פרופיל", path: "/profile" },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 16, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 32px)", maxWidth: 430, background: "rgba(255,255,255,.95)", border: "1px solid #ede9fe", borderRadius: 24, padding: "8px 10px", display: "grid", gridTemplateColumns: `repeat(${items.length},1fr)`, gap: 4, boxShadow: "0 18px 55px rgba(15,23,42,.16)", zIndex: 20 }}>
      {items.map(n => (
        <button key={n.id} onClick={() => router.push(n.path)} style={{ border: 0, background: active === n.id ? "#eef2ff" : "transparent", color: active === n.id ? "#4f46e5" : "#64748b", borderRadius: 16, padding: "9px 4px", fontFamily: "inherit", fontWeight: 950, cursor: "pointer" }}>
          <div style={{ fontSize: 19 }}>{n.icon}</div>
          <div style={{ fontSize: 11, marginTop: 2 }}>{n.label}</div>
        </button>
      ))}
    </nav>
  );
}
