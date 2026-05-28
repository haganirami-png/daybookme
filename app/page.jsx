/* eslint-disable */
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

const CATEGORIES = ["הכול", "יופי וטיפוח", "מספרות", "ציפורניים", "קוסמטיקה", "בריאות", "כושר", "רכב", "שיעורים", "אחר"];

const S = {
  page: {
    fontFamily: "Heebo, Arial, sans-serif",
    direction: "rtl",
    minHeight: "100vh",
    background: "#f6f7fb",
    color: "#111827",
  },
  wrap: {
    maxWidth: 1180,
    margin: "0 auto",
    padding: "18px 18px 90px",
  },
  hero: {
    background: "linear-gradient(135deg,#111827,#4f46e5 55%,#7c3aed)",
    color: "white",
    borderRadius: 28,
    padding: 24,
    boxShadow: "0 18px 45px rgba(79,70,229,.22)",
  },
  input: {
    width: "100%",
    border: 0,
    borderRadius: 18,
    padding: "16px 18px",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
    boxShadow: "0 10px 30px rgba(0,0,0,.12)",
  },
  chip: {
    border: "1px solid #e5e7eb",
    background: "white",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
    whiteSpace: "nowrap",
  },
  card: {
    background: "white",
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    overflow: "hidden",
    boxShadow: "0 10px 28px rgba(15,23,42,.06)",
  },
  btn: {
    border: 0,
    borderRadius: 14,
    padding: "12px 15px",
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  primary: { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" },
  ghost: { background: "#f3f4f6", color: "#374151" },
};

function isSubActive(sub) {
  if (!sub) return false;
  if (!["active", "trialing"].includes(sub.status)) return false;
  if (!sub.current_period_end) return true;
  return new Date(sub.current_period_end).getTime() > Date.now();
}

function safeText(v, fallback = "") {
  return String(v || fallback);
}

function businessImage(b) {
  return b?.logo_url || "";
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
    try {
      setFavorites(JSON.parse(localStorage.getItem("clientFavorites") || "[]"));
    } catch {
      setFavorites([]);
    }
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

  function latestSubForBusiness(id) {
    return subscriptions.find(x => x?.business_id === id) || null;
  }

  const visibleBusinesses = useMemo(() => {
    const q = query.trim().toLowerCase();

    return businesses
      .filter(b => b?.status !== "inactive")
      .filter(b => isSubActive(latestSubForBusiness(b.id)))
      .filter(b => category === "הכול" || safeText(b.category, "אחר") === category)
      .filter(b => {
        if (!q) return true;
        const bizServices = services.filter(s => s.business_id === b.id).map(s => s.name).join(" ");
        const text = [
          b.name,
          b.address,
          b.category,
          b.about,
          bizServices,
        ].join(" ").toLowerCase();
        return text.includes(q);
      });
  }, [businesses, services, subscriptions, query, category]);

  const favoriteBusinesses = visibleBusinesses.filter(b => favorites.includes(b.id));
  const newestBusinesses = [...visibleBusinesses].slice(0, 10);
  const popularBusinesses = [...visibleBusinesses].sort((a, b) => {
    const aCount = services.filter(s => s.business_id === a.id).length;
    const bCount = services.filter(s => s.business_id === b.id).length;
    return bCount - aCount;
  }).slice(0, 10);

  function toggleFavorite(id) {
    const next = favorites.includes(id) ? favorites.filter(x => x !== id) : [id, ...favorites];
    setFavorites(next);
    localStorage.setItem("clientFavorites", JSON.stringify(next));
  }

  if (!mounted) return null;

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        <header style={S.hero}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 13, opacity: .82, fontWeight: 800 }}>DayBookMe</div>
              <h1 style={{ margin: "6px 0 6px", fontSize: 34, lineHeight: 1.05 }}>כל התורים שלך במקום אחד</h1>
              <div style={{ opacity: .86 }}>מצא עסקים, שמור מועדפים וקבע תור תוך דקה.</div>
            </div>
            <a href="/business" style={{ textDecoration: "none" }}>
              <button style={{ ...S.btn, background: "rgba(255,255,255,.16)", color: "white" }}>כניסת עסקים</button>
            </a>
          </div>

          <input
            style={S.input}
            placeholder="חפש עסק, שירות, עיר..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </header>

        <section style={{ display: "flex", gap: 8, overflowX: "auto", padding: "18px 2px 8px" }}>
          {CATEGORIES.map(c => (
            <button
              key={c}
              style={{
                ...S.chip,
                background: category === c ? "#111827" : "white",
                color: category === c ? "white" : "#111827",
              }}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </section>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, margin: "12px 0 22px" }}>
          <MiniStat title="עסקים פעילים" value={visibleBusinesses.length} />
          <MiniStat title="מועדפים" value={favorites.length} />
          <MiniStat title="שירותים" value={services.filter(s => visibleBusinesses.some(b => b.id === s.business_id)).length} />
        </section>

        {loading ? (
          <div style={{ ...S.card, padding: 22, color: "#6b7280", fontWeight: 900 }}>טוען עסקים...</div>
        ) : visibleBusinesses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {favoriteBusinesses.length > 0 && (
              <Carousel
                title="❤️ המועדפים שלך"
                businesses={favoriteBusinesses}
                services={services}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
              />
            )}

            <Carousel
              title="🔥 עסקים מומלצים"
              businesses={popularBusinesses}
              services={services}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />

            <Carousel
              title="✨ חדשים ב־DayBookMe"
              businesses={newestBusinesses}
              services={services}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", marginTop: 22 }}>
              <h2 style={{ margin: 0, fontSize: 22 }}>כל העסקים</h2>
              <div style={{ color: "#6b7280", fontWeight: 800 }}>{visibleBusinesses.length} תוצאות</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))", gap: 14, marginTop: 12 }}>
              {visibleBusinesses.map(b => (
                <BusinessCard
                  key={b.id}
                  business={b}
                  services={services.filter(s => s.business_id === b.id)}
                  isFav={favorites.includes(b.id)}
                  onFav={() => toggleFavorite(b.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ title, value }) {
  return (
    <div style={{ ...S.card, padding: 14 }}>
      <div style={{ color: "#6b7280", fontSize: 12, fontWeight: 900 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: 950 }}>{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ ...S.card, padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 46 }}>🔎</div>
      <h2 style={{ marginBottom: 6 }}>לא נמצאו עסקים</h2>
      <div style={{ color: "#6b7280" }}>נסה לשנות חיפוש או קטגוריה. עסקים יופיעו כאן אחרי הפעלת מנוי.</div>
      <a href="/business" style={{ textDecoration: "none" }}>
        <button style={{ ...S.btn, ...S.primary, marginTop: 16 }}>אני בעל עסק</button>
      </a>
    </div>
  );
}

function Carousel({ title, businesses, services, favorites, toggleFavorite }) {
  if (!businesses.length) return null;

  return (
    <section style={{ marginTop: 20 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 22 }}>{title}</h2>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
        {businesses.map(b => (
          <div key={b.id} style={{ minWidth: 280, maxWidth: 280 }}>
            <BusinessCard
              business={b}
              services={services.filter(s => s.business_id === b.id)}
              isFav={favorites.includes(b.id)}
              onFav={() => toggleFavorite(b.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function BusinessCard({ business, services, isFav, onFav }) {
  const firstServices = services.slice(0, 3);
  const img = businessImage(business);

  return (
    <div style={S.card}>
      <div style={{
        height: 132,
        background: img ? `url(${img}) center/cover` : "linear-gradient(135deg,#ede9fe,#dbeafe)",
        position: "relative",
      }}>
        <button
          onClick={onFav}
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            border: 0,
            borderRadius: 999,
            width: 42,
            height: 42,
            background: "rgba(255,255,255,.92)",
            cursor: "pointer",
            fontSize: 20,
          }}
        >
          {isFav ? "❤️" : "🤍"}
        </button>
        <div style={{
          position: "absolute",
          right: 12,
          bottom: 12,
          width: 54,
          height: 54,
          borderRadius: 18,
          background: "white",
          display: "grid",
          placeItems: "center",
          fontSize: 28,
          boxShadow: "0 8px 22px rgba(0,0,0,.14)",
          overflow: "hidden",
        }}>
          {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "📅"}
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "start" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18 }}>{safeText(business.name, "עסק")}</h3>
            <div style={{ color: "#6b7280", fontSize: 13, marginTop: 4 }}>{safeText(business.category, "עסק מקומי")}</div>
          </div>
          <div style={{ background: "#dcfce7", color: "#166534", borderRadius: 999, padding: "5px 8px", fontSize: 11, fontWeight: 900 }}>פתוח להזמנות</div>
        </div>

        <div style={{ color: "#6b7280", fontSize: 13, marginTop: 8, minHeight: 18 }}>
          {business.address || "כתובת תוצג בקרוב"}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, minHeight: 28 }}>
          {firstServices.length === 0 ? (
            <span style={{ color: "#9ca3af", fontSize: 12 }}>שירותים יתעדכנו בקרוב</span>
          ) : firstServices.map(s => (
            <span key={s.id} style={{ background: "#f3f4f6", borderRadius: 999, padding: "6px 8px", fontSize: 12, fontWeight: 800 }}>
              {s.emoji || "✨"} {s.name}
            </span>
          ))}
        </div>

        <a href={`/book?business_id=${business.id}`} style={{ textDecoration: "none" }}>
          <button style={{ ...S.btn, ...S.primary, width: "100%", marginTop: 14 }}>קבע תור</button>
        </a>
      </div>
    </div>
  );
}
