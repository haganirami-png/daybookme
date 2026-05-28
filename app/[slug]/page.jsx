"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const S = {
  app: { fontFamily: "Heebo, Arial, sans-serif", direction: "rtl", background: "#fafafa", minHeight: "100vh", maxWidth: 430, margin: "0 auto" },
  btn: { border: 0, borderRadius: 12, padding: "11px 16px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  primary: (c) => ({ background: `linear-gradient(135deg,${c},#4f46e5)`, color: "white" }),
  ghost: { background: "#f3f4f6", color: "#374151" },
  card: { background: "white", borderRadius: 14, padding: "14px", marginBottom: 10, border: "1px solid #ede9fe" },
};

function ratingFor(id) { const n = String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0); return (4.6 + (n % 4) / 10).toFixed(1); }
function isSubActive(sub) { if (!sub) return false; if (!["active", "trialing"].includes(sub.status)) return false; if (!sub.current_period_end) return true; return new Date(sub.current_period_end).getTime() > Date.now(); }

export default function BusinessSlugPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [tab, setTab] = useState("book");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    setMounted(true);
    try { setFavorites(JSON.parse(localStorage.getItem("clientFavorites") || "[]")); } catch {}
    if (slug) loadBusiness(slug);
  }, [slug]);

  async function loadBusiness(s) {
    setLoading(true);
    const { data: b } = await supabase.from("businesses").select("*").eq("slug", s).maybeSingle();
    if (!b) { setNotFound(true); setLoading(false); return; }
    setBusiness(b);

    const [{ data: svc }, { data: emp }, { data: sub }] = await Promise.all([
      supabase.from("business_services").select("*").eq("business_id", b.id).eq("is_active", true),
      supabase.from("employees").select("*").eq("business_id", b.id).eq("status", "active"),
      supabase.from("business_subscriptions").select("*").eq("business_id", b.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    setServices(svc || []);
    setEmployees(emp || []);
    setSubscription(sub || null);
    setLoading(false);
  }

  function toggleFav() {
    if (!business) return;
    const next = favorites.includes(business.id) ? favorites.filter(x => x !== business.id) : [business.id, ...favorites];
    setFavorites(next);
    localStorage.setItem("clientFavorites", JSON.stringify(next));
  }

  if (!mounted || loading) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center", color: "#9ca3af" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
        <div style={{ fontFamily: "Heebo", fontSize: 14 }}>טוען...</div>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ ...S.app, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 24, textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 56 }}>😕</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: "#1e1b4b", marginTop: 12, fontFamily: "Heebo" }}>העסק לא נמצא</div>
        <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 8, fontFamily: "Heebo" }}>הכתובת לא קיימת או שהעסק הוסר</div>
        <button style={{ ...S.btn, ...S.ghost, marginTop: 20, fontFamily: "Heebo" }} onClick={() => router.push("/")}>← חזור לדף הבית</button>
      </div>
    </div>
  );

  const accent = business.accent_color || "#7c3aed";
  const isFav = favorites.includes(business.id);
  const subActive = isSubActive(subscription);
  const minPrice = services.length ? Math.min(...services.map(s => Number(s.price || 0))) : null;

  const HOURS = [
    { day: "ראשון–חמישי", time: `${business.work_start || "09:00"}–${business.work_end || "18:00"}` },
    { day: "שישי", time: "09:00–14:00" },
    { day: "שבת", time: "סגור" },
  ];

  return (
    <div style={S.app}>
      {/* COVER */}
      <div style={{ background: `linear-gradient(160deg,${accent},#4f46e5)`, padding: "52px 20px 24px", color: "white", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, left: -20, fontSize: 140, opacity: 0.07, lineHeight: 1, pointerEvents: "none" }}>{business.cover_emoji || "📅"}</div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 32, marginBottom: 6 }}>{business.cover_emoji || "📅"}</div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5 }}>{business.name}</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 3 }}>{business.category || "עסק מקומי"}</div>
            </div>
            <button onClick={toggleFav} style={{ background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.4)", borderRadius: 12, padding: "8px 12px", cursor: "pointer", fontSize: 20, color: "white" }}>
              {isFav ? "❤️" : "🤍"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.2)", borderRadius: 20, padding: "5px 12px", fontSize: 13, fontWeight: 700 }}>
              ⭐ {ratingFor(business.id)}
            </div>
            {business.address && <div style={{ fontSize: 12, opacity: 0.8, display: "flex", alignItems: "center", gap: 4 }}>📍 {business.address}</div>}
            {business.phone && <div style={{ fontSize: 12, opacity: 0.8, display: "flex", alignItems: "center", gap: 4 }}>📞 {business.phone}</div>}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ background: "white", display: "flex", borderBottom: "2px solid #f3f4f6", position: "sticky", top: 0, zIndex: 50 }}>
        {[{ id: "book", label: "📅 הזמן תור" }, { id: "about", label: "ℹ️ אודות" }, { id: "team", label: "👥 צוות" }].map(t => (
          <button key={t.id} style={{ flex: 1, padding: "13px 4px", textAlign: "center", fontSize: 13, fontWeight: tab === t.id ? 800 : 600, color: tab === t.id ? accent : "#9ca3af", borderBottom: tab === t.id ? `2px solid ${accent}` : "2px solid transparent", marginBottom: -2, cursor: "pointer", background: "transparent", border: "none", fontFamily: "inherit" }} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 16px 100px" }}>

        {/* BOOK TAB */}
        {tab === "book" && <>
          {!subActive && (
            <div style={{ ...S.card, background: "#fff7f7", borderColor: "#fecaca", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#dc2626" }}>⚠️ קביעת תורים לא זמינה כרגע</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>העסק טרם הפעיל את מערכת התורים</div>
            </div>
          )}

          <div style={{ fontSize: 16, fontWeight: 800, color: "#1e1b4b", marginBottom: 14 }}>השירותים שלנו</div>
          {services.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 32 }}>📋</div>
              <div style={{ marginTop: 8 }}>השירותים יתעדכנו בקרוב</div>
            </div>
          ) : services.map(svc => (
            <div key={svc.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12, cursor: subActive ? "pointer" : "default" }}
              onClick={() => subActive && router.push(`/book?business_id=${business.id}&service_id=${svc.id}`)}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f9f7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                {svc.emoji || "✨"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{svc.name}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{svc.duration} דקות</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 900, color: accent }}>₪{svc.price}</div>
              {subActive && <div style={{ fontSize: 18, color: "#9ca3af" }}>←</div>}
            </div>
          ))}
        </>}

        {/* ABOUT TAB */}
        {tab === "about" && <>
          {business.about && (
            <div style={S.card}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", marginBottom: 8 }}>אודות</div>
              <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, margin: 0 }}>{business.about}</p>
            </div>
          )}
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", marginBottom: 10 }}>פרטי התקשרות</div>
            {[
              { icon: "📍", label: "כתובת", value: business.address },
              { icon: "📞", label: "טלפון", value: business.phone },
              { icon: "📸", label: "אינסטגרם", value: business.instagram },
            ].filter(r => r.value).map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>{r.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e1b4b", marginTop: 2 }}>{r.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1e1b4b", marginBottom: 10 }}>שעות פעילות</div>
            {HOURS.map((h, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < HOURS.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>{h.day}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: h.time === "סגור" ? "#ef4444" : accent }}>{h.time}</div>
              </div>
            ))}
          </div>
          {business.address && (
            <button style={{ ...S.btn, background: "white", color: accent, border: `2px solid ${accent}`, width: "100%" }} onClick={() => window.open(`https://waze.com/ul?q=${encodeURIComponent(business.address)}`, "_blank")}>
              🗺️ נווט לעסק
            </button>
          )}
        </>}

        {/* TEAM TAB */}
        {tab === "team" && <>
          {employees.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", color: "#9ca3af" }}>
              <div style={{ fontSize: 32 }}>👥</div>
              <div style={{ marginTop: 8 }}>פרטי הצוות יתעדכנו בקרוב</div>
            </div>
          ) : employees.map(emp => (
            <div key={emp.id} style={{ ...S.card, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: emp.color || accent, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 18, flexShrink: 0 }}>
                {emp.name?.[0] || "?"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1e1b4b" }}>{emp.name}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{emp.role}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#fbbf24" }}>⭐</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{ratingFor(emp.id)}</div>
              </div>
            </div>
          ))}
        </>}
      </div>

      {/* STICKY BOOK BUTTON */}
      {tab === "book" && subActive && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", padding: "12px 16px 24px", borderTop: "1px solid #f0f0f0", zIndex: 50 }}>
          <button style={{ ...S.btn, ...S.primary(accent), width: "100%", fontSize: 16, padding: "15px" }} onClick={() => router.push(`/book?business_id=${business.id}`)}>
            📅 קבע תור עכשיו {minPrice !== null ? `· החל מ-₪${minPrice}` : ""}
          </button>
        </div>
      )}
    </div>
  );
}
