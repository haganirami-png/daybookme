/* eslint-disable */
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

const CATEGORIES = [
  { id: "הכול", label: "הכול", icon: "✨" },
  { id: "יופי וטיפוח", label: "יופי", icon: "💅" },
  { id: "מספרות", label: "שיער", icon: "✂️" },
  { id: "ציפורניים", label: "ציפורניים", icon: "💅" },
  { id: "קוסמטיקה", label: "קוסמטיקה", icon: "🧴" },
  { id: "בריאות", label: "בריאות", icon: "🩺" },
  { id: "כושר", label: "כושר", icon: "🏋️" },
  { id: "רכב", label: "רכב", icon: "🚗" },
  { id: "שיעורים", label: "שיעורים", icon: "📚" },
  { id: "אחר", label: "אחר", icon: "📍" },
];

const PALETTES = [
  ["#111827", "#4f46e5"],
  ["#0f172a", "#0891b2"],
  ["#3b0764", "#db2777"],
  ["#064e3b", "#10b981"],
  ["#7c2d12", "#f97316"],
  ["#1e1b4b", "#8b5cf6"],
];

const S = {
  page: {
    fontFamily: "var(--font-heebo), Heebo, Assistant, Arial, sans-serif",
    direction: "rtl",
    minHeight: "100vh",
    background: "linear-gradient(180deg,#f8fafc 0%,#eef2ff 42%,#f8fafc 100%)",
    color: "#0f172a",
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "18px 18px 104px",
  },
  topbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontWeight: 950,
    letterSpacing: "-.03em",
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 15,
    display: "grid",
    placeItems: "center",
    color: "white",
    fontSize: 22,
    background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
    boxShadow: "0 12px 28px rgba(79,70,229,.28)",
  },
  hero: {
    position: "relative",
    overflow: "hidden",
    background: "radial-gradient(circle at 18% 20%,rgba(255,255,255,.28),transparent 25%), linear-gradient(135deg,#0f172a 0%,#312e81 48%,#7c3aed 100%)",
    color: "white",
    borderRadius: 34,
    padding: "30px 28px",
    boxShadow: "0 24px 70px rgba(49,46,129,.28)",
  },
  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.2fr .8fr",
    gap: 24,
    alignItems: "center",
  },
  searchBox: {
    marginTop: 22,
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: 10,
    background: "rgba(255,255,255,.14)",
    border: "1px solid rgba(255,255,255,.2)",
    borderRadius: 22,
    padding: 8,
    backdropFilter: "blur(14px)",
  },
  input: {
    width: "100%",
    border: 0,
    borderRadius: 16,
    padding: "15px 17px",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    background: "white",
    color: "#111827",
  },
  btn: {
    border: 0,
    borderRadius: 16,
    padding: "13px 16px",
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  primary: { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" },
  ghost: { background: "rgba(15,23,42,.06)", color: "#334155" },
  card: {
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(226,232,240,.9)",
    borderRadius: 26,
    overflow: "hidden",
    boxShadow: "0 18px 45px rgba(15,23,42,.08)",
  },
  chip: {
    border: "1px solid #e2e8f0",
    background: "rgba(255,255,255,.92)",
    borderRadius: 999,
    padding: "11px 15px",
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
    boxShadow: "0 8px 22px rgba(15,23,42,.04)",
  },
  sectionHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: 12,
    margin: "30px 0 14px",
  },
  bottomNav: {
    position: "fixed",
    bottom: 16,
    left: "50%",
    transform: "translateX(-50%)",
    width: "calc(100% - 32px)",
    maxWidth: 560,
    background: "rgba(255,255,255,.92)",
    border: "1px solid rgba(226,232,240,.9)",
    borderRadius: 24,
    padding: "8px 10px",
    display: "grid",
    gridTemplateColumns: "repeat(5,1fr)",
    gap: 4,
    boxShadow: "0 18px 55px rgba(15,23,42,.16)",
    backdropFilter: "blur(16px)",
    zIndex: 20,
  },
};

function isSubActive(sub) {
  if (!sub) return false;
  if (!["active", "trialing"].includes(sub.status)) return false;
  if (!sub.current_period_end) return true;
  return new Date(sub.current_period_end).getTime() > Date.now();
}
function safeText(v, fallback = "") { return String(v || fallback); }
function businessImage(b) { return b?.logo_url || ""; }
function serviceText(services) { return services.slice(0, 2).map(s => s?.name).filter(Boolean).join(" • ") || "שירותים יתעדכנו בקרוב"; }
function ratingFor(id) {
  const n = String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (4.6 + (n % 4) / 10).toFixed(1);
}
function paletteFor(id) {
  const n = String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTES[n % PALETTES.length];
}

export default function ClientMarketplaceHome() {
  const [mounted, setMounted] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [services, setServices] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("הכול");
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    try { setFavorites(JSON.parse(localStorage.getItem("clientFavorites") || "[]")); } catch { setFavorites([]); }
    loadMarketplace();
  }, []);

  async function loadMarketplace() {
    setLoading(true);
    const [{ data: b }, { data: s }, { data: sub }] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: false }),
      supabase.from("business_services").select("*").eq("is_active", true),
      supabase.from("business_subscriptions").select("*").order("created_at", { ascending: false }),
    ]);
    setBusinesses(Array.isArray(b) ? b : []);
    setServices(Array.isArray(s) ? s : []);
    setSubscriptions(Array.isArray(sub) ? sub : []);
    setLoading(false);
  }

  function latestSubForBusiness(id) { return subscriptions.find(x => x?.business_id === id) || null; }

  const visibleBusinesses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses
      .filter(b => b?.status !== "inactive")
      .filter(b => isSubActive(latestSubForBusiness(b.id)))
      .filter(b => category === "הכול" || safeText(b.category, "אחר") === category)
      .filter(b => {
        if (!q) return true;
        const bizServices = services.filter(s => s.business_id === b.id).map(s => s.name).join(" ");
        const text = [b.name, b.address, b.category, b.about, bizServices].join(" ").toLowerCase();
        return text.includes(q);
      });
  }, [businesses, services, subscriptions, query, category]);

  const favoriteBusinesses = visibleBusinesses.filter(b => favorites.includes(b.id));
  const newestBusinesses = [...visibleBusinesses].slice(0, 10);
  const popularBusinesses = [...visibleBusinesses].sort((a, b) => services.filter(s => s.business_id === b.id).length - services.filter(s => s.business_id === a.id).length).slice(0, 10);

  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [id, ...favorites];
    setFavorites(next);
    localStorage.setItem("clientFavorites", JSON.stringify(next));
  }

  if (!mounted) return null;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <div style={S.topbar}>
          <div style={S.brand}><div style={S.logo}>📅</div><div><div style={{ fontSize: 21 }}>DayBookMe</div><div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>תורים, עסקים ומועדפים</div></div></div>
          <a href="/business" style={{ textDecoration: "none" }}><button style={{ ...S.btn, ...S.ghost }}>כניסת עסקים</button></a>
        </div>

        <header style={S.hero}>
          <div style={S.heroGrid} className="dbmHeroGrid">
            <div>
              <div style={{ display: "inline-flex", gap: 8, alignItems: "center", background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "8px 12px", fontWeight: 900, fontSize: 13 }}>⚡ קבע תור תוך דקה</div>
              <h1 style={{ margin: "16px 0 10px", fontSize: "clamp(34px,5vw,58px)", lineHeight: .96, letterSpacing: "-.055em" }}>מה בא לך לקבוע היום?</h1>
              <div style={{ opacity: .88, fontSize: 17, lineHeight: 1.55, maxWidth: 560 }}>מצא מספרות, קוסמטיקה, טיפולים, שיעורים ועסקים מומלצים — הכול במקום אחד.</div>
              <div style={S.searchBox}>
                <input style={S.input} placeholder="חפש עסק, שירות, עיר..." value={query} onChange={e => setQuery(e.target.value)} />
                <button style={{ ...S.btn, background: "#111827", color: "white" }}>חיפוש</button>
              </div>
            </div>
            <div style={{ display: "grid", gap: 12 }} className="dbmHeroCards">
              <HeroMini icon="💈" title="זמין היום" text="עסקים עם תורים קרובים" />
              <HeroMini icon="❤️" title="מועדפים" text="שמור עסקים שאתה אוהב" />
              <HeroMini icon="💳" title="תשלום באפליקציה" text="מוכן לחיבור API סליקה" />
            </div>
          </div>
        </header>

        <section style={{ display: "flex", gap: 10, overflowX: "auto", padding: "18px 2px 8px" }}>
          {CATEGORIES.map(c => (
            <button key={c.id} style={{ ...S.chip, background: category === c.id ? "#111827" : "rgba(255,255,255,.92)", color: category === c.id ? "white" : "#111827" }} onClick={() => setCategory(c.id)}>
              <span style={{ marginLeft: 6 }}>{c.icon}</span>{c.label}
            </button>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, margin: "12px 0 24px" }} className="dbmStatsGrid">
          <MiniStat title="עסקים פעילים" value={visibleBusinesses.length} icon="🏪" />
          <MiniStat title="מועדפים" value={favorites.length} icon="❤️" />
          <MiniStat title="שירותים" value={services.filter(s => visibleBusinesses.some(b => b.id === s.business_id)).length} icon="✨" />
        </section>

        {loading ? <LoadingGrid /> : visibleBusinesses.length === 0 ? <EmptyState /> : (
          <>
            {favoriteBusinesses.length > 0 && <Carousel title="❤️ המועדפים שלך" businesses={favoriteBusinesses} services={services} favorites={favorites} toggleFavorite={toggleFavorite} />}
            <Carousel title="🔥 מומלצים עכשיו" businesses={popularBusinesses} services={services} favorites={favorites} toggleFavorite={toggleFavorite} />
            <Carousel title="✨ חדשים באזור" businesses={newestBusinesses} services={services} favorites={favorites} toggleFavorite={toggleFavorite} />

            <div style={S.sectionHead}>
              <div><h2 style={{ margin: 0, fontSize: 25, letterSpacing: "-.035em" }}>כל העסקים</h2><div style={{ color: "#64748b", fontWeight: 800, marginTop: 4 }}>בחר עסק וקבע תור בכמה לחיצות</div></div>
              <div style={{ color: "#64748b", fontWeight: 900 }}>{visibleBusinesses.length} תוצאות</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(265px,1fr))", gap: 16 }}>
              {visibleBusinesses.map(b => <BusinessCard key={b.id} business={b} services={services.filter(s => s.business_id === b.id)} isFav={favorites.includes(b.id)} onFav={() => toggleFavorite(b.id)} />)}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function HeroMini({ icon, title, text }) {
  return <div style={{ background: "rgba(255,255,255,.13)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 22, padding: 16, backdropFilter: "blur(12px)" }}><div style={{ fontSize: 24 }}>{icon}</div><div style={{ fontWeight: 950, marginTop: 6 }}>{title}</div><div style={{ opacity: .78, fontSize: 13, marginTop: 3 }}>{text}</div></div>;
}
function MiniStat({ title, value, icon }) {
  return <div style={{ ...S.card, padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><div style={{ color: "#64748b", fontSize: 12, fontWeight: 950 }}>{title}</div><div style={{ fontSize: 30, fontWeight: 950, letterSpacing: "-.04em" }}>{value}</div></div><div style={{ width: 46, height: 46, borderRadius: 16, background: "#eef2ff", display: "grid", placeItems: "center", fontSize: 23 }}>{icon}</div></div>;
}
function LoadingGrid() { return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>{Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ ...S.card, height: 250, background: "linear-gradient(90deg,#fff,#f1f5f9,#fff)" }} />)}</div>; }
function EmptyState() { return <div style={{ ...S.card, padding: 34, textAlign: "center" }}><div style={{ fontSize: 56 }}>🔎</div><h2 style={{ marginBottom: 6 }}>לא נמצאו עסקים</h2><div style={{ color: "#64748b", lineHeight: 1.55 }}>נסה לשנות חיפוש או קטגוריה. עסקים יופיעו כאן אחרי הפעלת מנוי.</div><a href="/business" style={{ textDecoration: "none" }}><button style={{ ...S.btn, ...S.primary, marginTop: 18 }}>אני בעל עסק</button></a></div>; }

function Carousel({ title, businesses, services, favorites, toggleFavorite }) {
  if (!businesses.length) return null;
  return <section style={{ marginTop: 28 }}><div style={S.sectionHead}><h2 style={{ margin: 0, fontSize: 25, letterSpacing: "-.035em" }}>{title}</h2><span style={{ color: "#64748b", fontWeight: 900 }}>הצג הכול</span></div><div style={{ display: "flex", gap: 16, overflowX: "auto", padding: "2px 2px 12px" }}>{businesses.map(b => <div key={b.id} style={{ minWidth: 310, maxWidth: 310 }}><BusinessCard business={b} services={services.filter(s => s.business_id === b.id)} isFav={favorites.includes(b.id)} onFav={() => toggleFavorite(b.id)} /></div>)}</div></section>;
}

function BusinessCard({ business, services, isFav, onFav }) {
  const img = businessImage(business);
  const [a, b] = paletteFor(business.id);
  const minPrice = services.length ? Math.min(...services.map(s => Number(s.price || 0)).filter(n => n >= 0)) : null;
  return <div style={S.card} className="dbmBusinessCard">
    <div style={{ height: 154, background: img ? `linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.28)), url(${img}) center/cover` : `radial-gradient(circle at 20% 20%,rgba(255,255,255,.35),transparent 28%), linear-gradient(135deg,${a},${b})`, position: "relative" }}>
      <button onClick={onFav} style={{ position: "absolute", top: 12, left: 12, border: 0, borderRadius: 999, width: 44, height: 44, background: "rgba(255,255,255,.94)", cursor: "pointer", fontSize: 20, boxShadow: "0 10px 24px rgba(0,0,0,.14)" }}>{isFav ? "❤️" : "🤍"}</button>
      <div style={{ position: "absolute", right: 14, bottom: 14, display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ width: 58, height: 58, borderRadius: 20, background: "white", display: "grid", placeItems: "center", fontSize: 30, boxShadow: "0 12px 30px rgba(0,0,0,.18)", overflow: "hidden" }}>{img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📅"}</div>
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 14, background: "rgba(255,255,255,.92)", borderRadius: 999, padding: "7px 10px", fontWeight: 950, fontSize: 12 }}>⭐ {ratingFor(business.id)}</div>
    </div>
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
        <div style={{ minWidth: 0 }}><h3 style={{ margin: 0, fontSize: 19, letterSpacing: "-.025em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{safeText(business.name, "עסק")}</h3><div style={{ color: "#64748b", fontSize: 13, marginTop: 5, fontWeight: 800 }}>{safeText(business.category, "עסק מקומי")}</div></div>
        <div style={{ background: "#dcfce7", color: "#166534", borderRadius: 999, padding: "6px 9px", fontSize: 11, fontWeight: 950, whiteSpace: "nowrap" }}>זמין</div>
      </div>
      <div style={{ color: "#64748b", fontSize: 13, marginTop: 10, minHeight: 18, fontWeight: 700 }}>📍 {business.address || "כתובת תוצג בקרוב"}</div>
      <div style={{ color: "#475569", fontSize: 13, marginTop: 8, minHeight: 18, fontWeight: 800 }}>{serviceText(services)}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, minHeight: 32 }}>
        {services.slice(0, 3).map(s => <span key={s.id} style={{ background: "#f1f5f9", color: "#334155", borderRadius: 999, padding: "7px 9px", fontSize: 12, fontWeight: 900 }}>{s.emoji || "✨"} {s.name}</span>)}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 16 }}>
        <div style={{ color: "#64748b", fontWeight: 800, fontSize: 12 }}>{minPrice !== null ? <>החל מ־<b style={{ color: "#111827", fontSize: 16 }}>₪{minPrice}</b></> : "מחיר יתעדכן"}</div>
        <a href={`/book?business_id=${business.id}`} style={{ textDecoration: "none", flex: 1 }}><button style={{ ...S.btn, ...S.primary, width: "100%" }}>קבע תור</button></a>
      </div>
    </div>
  </div>;
}


function BottomNav() {
  const items = [
    { icon: "🏠", label: "בית", href: "/", active: true },
    { icon: "🔍", label: "חיפוש", href: "/search" },
    { icon: "❤️", label: "מועדפים", href: "/favorites" },
    { icon: "📅", label: "תורים", href: "/my-bookings" },
    { icon: "👤", label: "פרופיל", href: "/profile" },
  ];

  return (
    <nav style={S.bottomNav}>
      {items.map((it) => (
        <Link key={it.href} href={it.href} style={{ textDecoration: "none" }}>
          <button style={{
            width:"100%",
            border:0,
            background: it.active ? "#eef2ff" : "transparent",
            color: it.active ? "#4f46e5" : "#64748b",
            borderRadius:16,
            padding:"9px 4px",
            fontFamily:"inherit",
            fontWeight:950,
            cursor:"pointer"
          }}>
            <div style={{ fontSize: 19 }}>{it.icon}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>{it.label}</div>
          </button>
        </Link>
      ))}
    </nav>
  );
}

