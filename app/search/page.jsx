"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const accent = "#7c3aed";

const S = {
  app: {
    fontFamily: "Heebo, Arial, sans-serif",
    direction: "rtl",
    background: "#f4f3ff",
    minHeight: "100vh",
    maxWidth: 430,
    margin: "0 auto",
    color: "#1e1b4b",
  },
  header: {
    background: `linear-gradient(135deg,${accent},#4f46e5)`,
    padding: "52px 20px 22px",
    color: "white",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  btn: {
    border: 0,
    borderRadius: 12,
    padding: "11px 16px",
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  primary: {
    background: `linear-gradient(135deg,${accent},#4f46e5)`,
    color: "white",
  },
  ghost: {
    background: "rgba(255,255,255,0.18)",
    color: "white",
  },
  input: {
    width: "100%",
    padding: "13px 14px",
    border: "1.5px solid #e5e7eb",
    borderRadius: 14,
    fontSize: 15,
    fontFamily: "inherit",
    boxSizing: "border-box",
    outline: "none",
    background: "white",
  },
  card: {
    background: "white",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    border: "1px solid #ede9fe",
    boxShadow: "0 10px 25px rgba(76,29,149,0.06)",
  },
};

function ratingFor(id) {
  const n = String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return (4.6 + (n % 4) / 10).toFixed(1);
}

function getLogo(business) {
  return business.logo_url || business.image_url || business.cover_url || "";
}

function getBusinessPath(business) {
  return `/${business.slug || business.id}`;
}

export default function Search() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    loadBusinesses();
    try {
      setFavorites(JSON.parse(localStorage.getItem("clientFavorites") || "[]"));
    } catch {}
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("businesses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("BUSINESSES ERROR:", error);
      setError("לא הצלחנו לטעון עסקים כרגע");
      setBusinesses([]);
    } else {
      setBusinesses(Array.isArray(data) ? data : []);
    }

    setLoading(false);
  }

  function toggleFavorite(e, businessId) {
    e.stopPropagation();
    const next = favorites.includes(businessId)
      ? favorites.filter((id) => id !== businessId)
      : [businessId, ...favorites];

    setFavorites(next);
    localStorage.setItem("clientFavorites", JSON.stringify(next));
  }

  const categories = useMemo(() => {
    const list = businesses.map((b) => b.category).filter(Boolean);
    return ["all", ...Array.from(new Set(list))];
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const q = query.trim().toLowerCase();

    return businesses.filter((b) => {
      const matchesCategory = category === "all" || b.category === category;
      const text = `${b.name || ""} ${b.category || ""} ${b.address || ""} ${b.about || ""}`.toLowerCase();
      const matchesQuery = !q || text.includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [businesses, query, category]);

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <button style={{ ...S.btn, ...S.ghost }} onClick={() => router.push("/")}>🏠 בית</button>
          <button style={{ ...S.btn, ...S.ghost }} onClick={() => router.push("/my-bookings")}>📅 התורים שלי</button>
        </div>

        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>🔍 חיפוש עסקים</div>
        <div style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>
          מצא עסקים, צפה בפרופיל וקבע תור בקליק
        </div>
      </div>

      <div style={{ padding: "16px 16px 90px" }}>
        <input
          style={S.input}
          placeholder="חפש לפי שם עסק, קטגוריה או עיר..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 0 14px" }}>
          {categories.map((cat) => (
            <button
              key={cat}
              style={{
                ...S.btn,
                flexShrink: 0,
                padding: "9px 13px",
                background: category === cat ? accent : "white",
                color: category === cat ? "white" : "#4c1d95",
                border: category === cat ? "none" : "1px solid #ede9fe",
              }}
              onClick={() => setCategory(cat)}
            >
              {cat === "all" ? "כל העסקים" : cat}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "44px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 42 }}>📅</div>
            <div style={{ marginTop: 10, fontWeight: 800 }}>טוען עסקים...</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ ...S.card, textAlign: "center", color: "#dc2626", fontWeight: 800 }}>
            {error}
          </div>
        )}

        {!loading && !error && filteredBusinesses.length === 0 && (
          <div style={{ ...S.card, textAlign: "center", padding: "44px 16px", color: "#9ca3af" }}>
            <div style={{ fontSize: 44 }}>📭</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#374151", marginTop: 10 }}>לא נמצאו עסקים</div>
            <div style={{ fontSize: 13, marginTop: 5 }}>נסה לחפש שם אחר או קטגוריה אחרת</div>
          </div>
        )}

        {!loading && !error && filteredBusinesses.map((business) => {
          const logo = getLogo(business);
          const businessAccent = business.accent_color || accent;
          const isFav = favorites.includes(business.id);

          return (
            <div
              key={business.id}
              style={{ ...S.card, cursor: "pointer", overflow: "hidden" }}
              onClick={() => router.push(getBusinessPath(business))}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 18,
                    background: logo ? `url(${logo}) center/cover` : `linear-gradient(135deg,${businessAccent},#4f46e5)`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: 28,
                    fontWeight: 900,
                    flexShrink: 0,
                  }}
                >
                  {!logo && (business.cover_emoji || business.name?.[0] || "🏪")}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {business.name || "עסק ללא שם"}
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(e, business.id)}
                      style={{ background: "transparent", border: 0, fontSize: 20, cursor: "pointer", padding: 0 }}
                      aria-label="הוסף למועדפים"
                    >
                      {isFav ? "❤️" : "🤍"}
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: "#7c3aed", fontWeight: 800, marginTop: 3 }}>
                    {business.category || "עסק מקומי"} · ⭐ {ratingFor(business.id)}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, marginTop: 3 }}>
                    לחץ על הכרטיס לצפייה בכל הפרטים
                  </div>

                  {business.address && (
                    <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      📍 {business.address}
                    </div>
                  )}
                </div>
              </div>

              {business.about && (
                <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.55, marginTop: 12 }}>
                  {String(business.about).slice(0, 105)}{String(business.about).length > 105 ? "..." : ""}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  style={{ ...S.btn, ...S.primary, flex: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(getBusinessPath(business));
                  }}
                >
                  צפייה בפרופיל
                </button>
                <button
                  style={{ ...S.btn, background: "#f3f4f6", color: "#374151", flex: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/book?business_id=${business.id}`);
                  }}
                >
                  קביעת תור
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
