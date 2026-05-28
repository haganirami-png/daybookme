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
};

function ratingFor(id) { const n = String(id || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0); return (4.6 + (n % 4) / 10).toFixed(1); }

export default function Favorites() {
  const router = useRouter();
  const [favorites, setFavorites] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = JSON.parse(localStorage.getItem("clientFavorites") || "[]");
      setFavorites(saved);
      if (saved.length > 0) loadFavorites(saved);
    } catch { setFavorites([]); }
  }, []);

  async function loadFavorites(ids) {
    const { data } = await supabase.from("businesses").select("*").in("id", ids);
    setBusinesses(data || []);
  }

  function removeFavorite(id) {
    const next = favorites.filter(x => x !== id);
    setFavorites(next);
    setBusinesses(p => p.filter(b => b.id !== id));
    localStorage.setItem("clientFavorites", JSON.stringify(next));
  }

  if (!mounted) return null;

  return (
    <div style={S.app}>
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }} onClick={() => router.push("/")}>← חזור</button>
          <div style={{ fontSize: 16, fontWeight: 900 }}>❤️ המועדפים שלי</div>
          <div style={{ width: 60 }} />
        </div>
      </div>

      <div style={{ padding: "16px 16px 80px" }}>
        {favorites.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}>
            <div style={{ fontSize: 56 }}>🤍</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginTop: 12 }}>אין מועדפים עדיין</div>
            <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6 }}>לחץ על ❤️ בכרטיס עסק כדי לשמור</div>
            <button style={{ ...S.btn, ...S.primary, marginTop: 20 }} onClick={() => router.push("/")}>🔍 חפש עסקים</button>
          </div>
        ) : businesses.map(b => (
          <div key={b.id} style={S.card}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#7c3aed,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
                {b.logo_url ? <img src={b.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 14 }} /> : "📅"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1e1b4b" }}>{b.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{b.category || "עסק מקומי"}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>📍 {b.address || ""}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ color: "#fbbf24", fontSize: 13 }}>⭐</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{ratingFor(b.id)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn, ...S.primary, flex: 1 }} onClick={() => router.push(`/book?business_id=${b.id}`)}>📅 קבע תור</button>
              <button style={{ ...S.btn, background: "#fee2e2", color: "#dc2626" }} onClick={() => removeFavorite(b.id)}>🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {/* BOTTOM NAV */}
      <BottomNav active="favorites" />
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
