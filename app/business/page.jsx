/* eslint-disable */
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const PLANS = [
  { id: "starter", name: "Starter", price: 99, badge: "להתחלה", features: ["עד 100 תורים", "עמוד הזמנה", "ניהול בסיסי"] },
  { id: "pro", name: "Pro", price: 199, badge: "מומלץ", features: ["תורים ללא הגבלה", "Realtime", "הגדרות מלאות"] },
  { id: "premium", name: "Premium", price: 349, badge: "מתקדם", features: ["כמה צוותים", "אוטומציות", "תמיכה מועדפת"] },
];
const DAYS = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const TIMES = Array.from({ length: 29 }, (_, i) => {
  const mins = 8 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

const S = {
  page: { fontFamily: "Heebo, Arial, sans-serif", direction: "rtl", minHeight: "100vh", background: "#f6f7fb", color: "#111827" },
  wrap: { maxWidth: 1180, margin: "0 auto", padding: 20 },
  card: { background: "white", border: "1px solid #e5e7eb", borderRadius: 18, padding: 18, boxShadow: "0 10px 30px rgba(15,23,42,.05)" },
  input: { width: "100%", padding: "12px 14px", border: "1px solid #d1d5db", borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box" },
  btn: { border: 0, borderRadius: 12, padding: "11px 16px", fontWeight: 800, cursor: "pointer", fontFamily: "inherit" },
  primary: { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" },
  ghost: { background: "#f3f4f6", color: "#374151" },
  danger: { background: "#fee2e2", color: "#b91c1c" },
  label: { fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6, display: "block" },
};

function slugify(v) {
  return (v || "business").toLowerCase().trim().replace(/[^a-z0-9א-ת]+/gi, "-").replace(/^-|-$/g, "") || `business-${Date.now()}`;
}
function isActiveSubscription(sub) {
  if (!sub) return false;
  if (!["active", "trialing"].includes(sub.status)) return false;
  if (!sub.current_period_end) return true;
  return new Date(sub.current_period_end).getTime() > Date.now();
}
function safeTime(v) { return String(v || "").slice(0, 5); }
function todayIso() { return new Date().toISOString().slice(0, 10); }
function arr(v) { return Array.isArray(v) ? v.filter(Boolean) : []; }
function obj(v) { return v && typeof v === "object" ? v : {}; }
function getClientName(a) { return a?.client_name || a?.client?.name || "לקוח"; }
function getClientPhone(a) { return a?.client_phone || a?.client?.phone || ""; }


export default function BusinessApp() {
  const [authReady, setAuthReady] = useState(false);
  const [business, setBusiness] = useState(null);
  const [token, setToken] = useState(null);
  const [mode, setMode] = useState("login");
  const [login, setLogin] = useState({ phone: "", password: "" });
  const [register, setRegister] = useState({ name: "", owner_name: "", phone: "", password: "", address: "", category: "יופי וטיפוח", logo_url: "" });
  const [tab, setTab] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const [appointments, setAppointments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services, setServices] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [daysOff, setDaysOff] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [newEmployee, setNewEmployee] = useState({ name: "", role: "", phone: "" });
  const [newService, setNewService] = useState({ name: "", duration: 45, price: 100, emoji: "✨", employee_id: "" });
  const [newDayOff, setNewDayOff] = useState({ date: todayIso(), reason: "" });
  const [newBreak, setNewBreak] = useState({ day_of_week: 0, start_time: "13:00", end_time: "13:30", title: "הפסקה" });

  const subActive = isActiveSubscription(subscription);
  const bookingUrl = business ? `${typeof window !== "undefined" ? window.location.origin : ""}/book?business_id=${business.id}` : "";

  const notify = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  useEffect(() => {
    const saved = localStorage.getItem("businessSession");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBusiness(parsed.business);
        setToken(parsed.token);
      } catch {}
    }
    setAuthReady(true);
  }, []);

  useEffect(() => { if (business?.id) loadAll(business.id); }, [business?.id]);

  useEffect(() => {
    if (!business?.id) return;
    const ch = supabase.channel(`biz-${business.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `business_id=eq.${business.id}` }, () => loadAppointments(business.id))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [business?.id]);

  async function apiAuth(action, payload) {
    const res = await fetch(`/api/business-auth/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "שגיאה");
    return data;
  }

  async function doLogin() {
    setLoading(true);
    try {
      const data = await apiAuth("login", login);
      localStorage.setItem("businessSession", JSON.stringify(data));
      setBusiness(data.business); setToken(data.token); notify("נכנסת בהצלחה");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }
  async function doRegister() {
    if (!register.name || !register.phone || register.password.length < 6) return alert("שם עסק, טלפון וסיסמה של לפחות 6 תווים");
    setLoading(true);
    try {
      const payload = { ...register, slug: slugify(register.name) };
      const data = await apiAuth("register", payload);
      localStorage.setItem("businessSession", JSON.stringify(data));
      setBusiness(data.business); setToken(data.token); notify("העסק נפתח בהצלחה");
    } catch (e) { alert(e.message); } finally { setLoading(false); }
  }
  function logout() { localStorage.removeItem("businessSession"); setBusiness(null); setToken(null); }

  async function loadAll(id) { await Promise.all([loadBusiness(id), loadAppointments(id), loadEmployees(id), loadServices(id), loadAvailability(id), loadSubscription(id), loadBreaks(id), loadDaysOff(id)]); }
  async function loadBusiness(id) { const { data } = await supabase.from("businesses").select("*").eq("id", id).single(); if (data) setBusiness(data); }
  async function loadAppointments(id) { const { data } = await supabase.from("appointments").select("*").eq("business_id", id).order("date", { ascending: true }).order("time", { ascending: true }); setAppointments(arr(data)); }
  async function loadEmployees(id) { const { data } = await supabase.from("employees").select("*").eq("business_id", id).order("created_at"); setEmployees(arr(data)); }
  async function loadServices(id) { const { data } = await supabase.from("business_services").select("*").eq("business_id", id).eq("is_active", true).order("created_at"); setServices(arr(data)); }
  async function loadAvailability(id) { const { data } = await supabase.from("business_availability").select("*").eq("business_id", id).order("day_of_week"); setAvailability(arr(data)); }
  async function loadBreaks(id) { const { data } = await supabase.from("business_breaks").select("*").eq("business_id", id).order("day_of_week"); setBreaks(arr(data)); }
  async function loadDaysOff(id) { const { data } = await supabase.from("business_days_off").select("*").eq("business_id", id).order("date", { ascending: false }); setDaysOff(arr(data)); }
  async function loadSubscription(id) { const { data } = await supabase.from("business_subscriptions").select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(); setSubscription(data || null); }

  async function uploadBusinessImage(file, field, multiple = false) {
    if (!file || !business?.id) return;

    const isImage = String(file.type || "").startsWith("image/");
    if (!isImage) return alert("אפשר להעלות רק קובץ תמונה");

    const ext = file.name?.split(".").pop() || "jpg";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${business.id}/${field}/${safeName}`;

    setLoading(true);
    try {
      const { error: uploadError } = await supabase.storage
        .from("business-media")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("business-media")
        .getPublicUrl(path);

      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) throw new Error("לא הצלחנו לקבל קישור לתמונה");

      let patch = { [field]: publicUrl };

      if (multiple) {
        let current = business.gallery_urls || [];
        if (typeof current === "string") {
          try { current = JSON.parse(current); } catch { current = current.split(",").map(x => x.trim()).filter(Boolean); }
        }
        if (!Array.isArray(current)) current = [];
        patch = { gallery_urls: [...current, publicUrl] };
      }

      const { error: updateError } = await supabase
        .from("businesses")
        .update(patch)
        .eq("id", business.id);

      if (updateError) throw updateError;

      notify("התמונה הועלתה ונשמרה");
      await loadBusiness(business.id);
    } catch (e) {
      console.error("UPLOAD ERROR:", e);
      alert("שגיאה בהעלאת תמונה: " + (e.message || "נסה שוב"));
    } finally {
      setLoading(false);
    }
  }

  async function updateBusiness(patch) { const { error } = await supabase.from("businesses").update(patch).eq("id", business.id); if (error) return alert(error.message); notify("נשמר"); loadBusiness(business.id); }
  async function addEmployee() { if (!newEmployee.name) return; const { error } = await supabase.from("employees").insert({ business_id: business.id, ...newEmployee }); if (error) return alert(error.message); setNewEmployee({ name: "", role: "", phone: "" }); loadEmployees(business.id); notify("עובד נוסף"); }
  async function removeEmployee(id) { await supabase.from("employees").update({ status: "inactive" }).eq("id", id); loadEmployees(business.id); }
  async function addService() { if (!newService.name) return; const { error } = await supabase.from("business_services").insert({ business_id: business.id, ...newService, employee_id: newService.employee_id || null }); if (error) return alert(error.message); setNewService({ name: "", duration: 45, price: 100, emoji: "✨", employee_id: "" }); loadServices(business.id); notify("שירות נוסף"); }
  async function removeService(id) { await supabase.from("business_services").update({ is_active: false }).eq("id", id); loadServices(business.id); }
  async function updateAvailability(row) { await supabase.from("business_availability").upsert({ ...row, business_id: business.id }, { onConflict: "business_id,day_of_week" }); loadAvailability(business.id); notify("זמינות נשמרה"); }
  async function addBreak() { await supabase.from("business_breaks").insert({ business_id: business.id, ...newBreak }); loadBreaks(business.id); notify("הפסקה נוספה"); }
  async function addDayOff() { await supabase.from("business_days_off").insert({ business_id: business.id, ...newDayOff }); loadDaysOff(business.id); notify("יום חופש נוסף"); }
  async function setApptStatus(id, status) { await supabase.from("appointments").update({ status }).eq("id", id); loadAppointments(business.id); }
  async function startCheckout(planId) { setLoading(true); try { const res = await fetch("/api/payments/create-checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId: business.id, planId }) }); const data = await res.json(); if (data.checkoutUrl) window.location.href = data.checkoutUrl; else loadSubscription(business.id); } finally { setLoading(false); } }

  const stats = useMemo(() => ({ upcoming: arr(appointments).filter(a => ["pending", "upcoming", "confirmed"].includes(a?.status)).length, today: arr(appointments).filter(a => a?.date === todayIso()).length, cancelled: arr(appointments).filter(a => a?.status === "cancelled").length }), [appointments]);

  if (!authReady) return null;
  if (!business) return <AuthScreen mode={mode} setMode={setMode} login={login} setLogin={setLogin} register={register} setRegister={setRegister} doLogin={doLogin} doRegister={doRegister} loading={loading} />;

  const nav = [
    ["dashboard", "📊 לוח עסק"], ["appointments", "📅 תורים"], ["settings", "⚙️ הגדרות עסק"], ["services", "💈 שירותים"], ["employees", "👥 עובדים"], ["availability", "🕒 זמינות"], ["billing", "💳 מנוי"]
  ];

  return <div style={S.page}>
    <div style={{ background: "linear-gradient(135deg,#111827,#4f46e5)", color: "white" }}><div style={{ ...S.wrap, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div><div style={{ fontSize: 24, fontWeight: 900 }}>{business.name}</div><div style={{ opacity: .75, fontSize: 13 }}>{business.address || "לא הוגדרה כתובת"}</div></div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button
          style={{ ...S.btn, background: "rgba(255,255,255,.18)", color: "white", border: "1px solid rgba(255,255,255,.2)" }}
          onClick={() => window.open(`/${business.id}`, "_blank")}
        >
          👁️ הצג את פרופיל העסק
        </button>
        <button
          style={{ ...S.btn, background: "rgba(255,255,255,.14)", color: "white" }}
          onClick={() => navigator.clipboard.writeText(bookingUrl).then(() => notify("הקישור הועתק"))}
        >
          🔗 העתק קישור לקוחות
        </button>
        <button
          style={{ ...S.btn, background: "rgba(255,255,255,.14)", color: "white" }}
          onClick={logout}
        >
          יציאה
        </button>
      </div>
    </div></div>
    <div style={{ ...S.wrap, display: "grid", gridTemplateColumns: "220px 1fr", gap: 16 }}>
      <aside style={{ ...S.card, height: "fit-content", position: "sticky", top: 16 }}>
        <div style={{ fontSize: 12, color: subActive ? "#059669" : "#dc2626", fontWeight: 900, marginBottom: 12 }}>{subActive ? "● מנוי פעיל" : "● מנוי לא פעיל"}</div>
        {arr(nav).map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ ...S.btn, width: "100%", textAlign: "right", marginBottom: 7, background: tab === id ? "#ede9fe" : "transparent", color: tab === id ? "#5b21b6" : "#374151" }}>{label}</button>)}
      </aside>
      <main>{!subActive && tab !== "billing" && <div style={{ ...S.card, borderColor: "#fecaca", background: "#fff7f7", marginBottom: 16 }}><b>המנוי לא פעיל.</b> עמוד הלקוחות של העסק נעול ולא יאפשר קביעת תורים עד הפעלת מנוי. <button style={{ ...S.btn, ...S.primary, marginRight: 12 }} onClick={() => setTab("billing")}>הפעל מנוי</button></div>}
        {tab === "dashboard" && <Dashboard stats={stats} appointments={appointments} bookingUrl={bookingUrl} />}
        {tab === "appointments" && <Appointments appointments={appointments} setApptStatus={setApptStatus} />}
        {tab === "settings" && <Settings business={business} updateBusiness={updateBusiness} uploadBusinessImage={uploadBusinessImage} loading={loading} />}
        {tab === "services" && <Services services={services} employees={employees} newService={newService} setNewService={setNewService} addService={addService} removeService={removeService} />}
        {tab === "employees" && <Employees employees={employees} newEmployee={newEmployee} setNewEmployee={setNewEmployee} addEmployee={addEmployee} removeEmployee={removeEmployee} />}
        {tab === "availability" && <Availability availability={availability} updateAvailability={updateAvailability} breaks={breaks} addBreak={addBreak} newBreak={newBreak} setNewBreak={setNewBreak} daysOff={daysOff} addDayOff={addDayOff} newDayOff={newDayOff} setNewDayOff={setNewDayOff} />}
        {tab === "billing" && <Billing subscription={subscription} startCheckout={startCheckout} loading={loading} />}
      </main>
    </div>
    {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#111827", color: "white", borderRadius: 999, padding: "12px 18px", fontWeight: 800 }}>{toast}</div>}
  </div>;
}

function AuthScreen({ mode, setMode, login, setLogin, register, setRegister, doLogin, doRegister, loading }) {
  return <div style={{ ...S.page, display: "grid", placeItems: "center", padding: 20 }}><div style={{ ...S.card, width: "100%", maxWidth: 430 }}>
    <div style={{ fontSize: 30, fontWeight: 900, marginBottom: 6 }}>DayBookMe לעסקים</div><div style={{ color: "#6b7280", marginBottom: 18 }}>כניסה מאובטחת לעסק עם סיסמה</div>
    <div style={{ display: "flex", gap: 8, marginBottom: 16 }}><button style={{ ...S.btn, flex: 1, ...(mode === "login" ? S.primary : S.ghost) }} onClick={() => setMode("login")}>כניסה</button><button style={{ ...S.btn, flex: 1, ...(mode === "register" ? S.primary : S.ghost) }} onClick={() => setMode("register")}>הרשמת עסק</button></div>
    {mode === "login" ? <div style={{ display: "grid", gap: 12 }}><Field label="טלפון עסק" value={login.phone} onChange={v => setLogin({ ...login, phone: v })} /><Field label="סיסמה" type="password" value={login.password} onChange={v => setLogin({ ...login, password: v })} /><button style={{ ...S.btn, ...S.primary }} onClick={doLogin} disabled={loading}>{loading ? "בודק..." : "כניסה לעסק"}</button></div>
      : <div style={{ display: "grid", gap: 12 }}><Field label="שם העסק" value={register.name} onChange={v => setRegister({ ...register, name: v })} /><Field label="שם בעלים" value={register.owner_name} onChange={v => setRegister({ ...register, owner_name: v })} /><Field label="טלפון" value={register.phone} onChange={v => setRegister({ ...register, phone: v })} /><Field label="סיסמה" type="password" value={register.password} onChange={v => setRegister({ ...register, password: v })} /><Field label="כתובת" value={register.address} onChange={v => setRegister({ ...register, address: v })} /><Field label="קישור לוגו / תמונה" value={register.logo_url} onChange={v => setRegister({ ...register, logo_url: v })} /><button style={{ ...S.btn, ...S.primary }} onClick={doRegister} disabled={loading}>{loading ? "פותח עסק..." : "פתח עסק"}</button></div>}
  </div></div>;
}
function Field({ label, value, onChange, type = "text" }) { return <label><span style={S.label}>{label}</span><input style={S.input} type={type} value={value || ""} onChange={e => onChange(e.target.value)} /></label>; }
function Dashboard({ stats, appointments, bookingUrl }) { const safeStats = obj(stats); const safeAppointments = arr(appointments); return <div style={{ display: "grid", gap: 16 }}><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>{[["תורים פעילים", safeStats.upcoming || 0], ["היום", safeStats.today || 0], ["בוטלו", safeStats.cancelled || 0]].map(([l, v]) => <div key={l} style={S.card}><div style={{ color: "#6b7280", fontWeight: 800 }}>{l}</div><div style={{ fontSize: 34, fontWeight: 900 }}>{v}</div></div>)}</div><div style={S.card}><b>קישור הזמנה ללקוחות</b><div style={{ marginTop: 8, padding: 12, borderRadius: 10, background: "#f3f4f6", direction: "ltr", textAlign: "left", overflow: "auto" }}>{bookingUrl}</div></div><Appointments appointments={safeAppointments.slice(0, 5)} setApptStatus={() => {}} compact /></div>; }
function Appointments({ appointments, setApptStatus, compact }) { return <div style={S.card}><h2 style={{ marginTop: 0 }}>תורים</h2><div style={{ display: "grid", gap: 10 }}>{arr(appointments).length === 0 ? <div style={{ color: "#6b7280" }}>אין תורים עדיין</div> : arr(appointments).map(a => <div key={a.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 12, display: "grid", gridTemplateColumns: "1fr auto", gap: 10 }}><div><b>{getClientName(a)}</b> · {getClientPhone(a)}<div style={{ color: "#6b7280", fontSize: 13 }}>{a?.service || ""} · {a?.date || ""} · {safeTime(a?.time)} · {a?.duration || ""} דק׳</div>{a?.notes && <div style={{ color: "#7c3aed", fontSize: 13 }}>הערה: {a.notes}</div>}</div><div style={{ display: "flex", gap: 6, alignItems: "center" }}><span style={{ fontWeight: 900, color: a?.status === "cancelled" ? "#dc2626" : a?.status === "confirmed" ? "#059669" : "#d97706" }}>{a?.status || "pending"}</span>{!compact && <><button style={{ ...S.btn, background: "#dcfce7", color: "#166534" }} onClick={() => setApptStatus(a.id, "confirmed")}>אשר</button><button style={{ ...S.btn, ...S.danger }} onClick={() => setApptStatus(a.id, "cancelled")}>בטל</button></>}</div></div>)}</div></div>; }
function parseGallery(v) {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {}
    return v.split(",").map(x => x.trim()).filter(Boolean);
  }
  return [];
}

function ImageUploadBox({ title, desc, preview, onUpload, loading, multiple = false }) {
  return <div style={{ border: "1px dashed #c4b5fd", borderRadius: 16, padding: 14, background: "#faf5ff" }}>
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ width: 78, height: 58, borderRadius: 14, background: preview ? `url(${preview}) center/cover` : "#ede9fe", display: "grid", placeItems: "center", color: "#7c3aed", fontWeight: 900, overflow: "hidden" }}>
        {!preview && "📸"}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 900, color: "#1e1b4b" }}>{title}</div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>{desc}</div>
      </div>
      <label style={{ ...S.btn, ...S.primary, display: "inline-block", opacity: loading ? .6 : 1 }}>
        {loading ? "מעלה..." : "בחר תמונה"}
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          style={{ display: "none" }}
          disabled={loading}
          onChange={async (e) => {
            const files = Array.from(e.target.files || []);
            for (const file of files) await onUpload(file);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  </div>;
}

function Settings({ business, updateBusiness, uploadBusinessImage, loading }) {
  const [form, setForm] = useState(business || {});
  useEffect(() => setForm(business || {}), [business?.id]);
  if (!form) return null;

  const gallery = parseGallery(form.gallery_urls || form.photos || form.images || form.gallery);

  return <div style={{ display: "grid", gap: 16 }}>
    <div style={S.card}>
      <h2 style={{ marginTop: 0 }}>הגדרות עסק</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="שם עסק" value={form.name} onChange={v => setForm({ ...form, name: v })} />
        <Field label="טלפון" value={form.phone} onChange={v => setForm({ ...form, phone: v })} />
        <Field label="כתובת" value={form.address} onChange={v => setForm({ ...form, address: v })} />
        <Field label="קטגוריה" value={form.category} onChange={v => setForm({ ...form, category: v })} />
        <Field label="קישור לוגו" value={form.logo_url} onChange={v => setForm({ ...form, logo_url: v })} />
        <Field label="קישור באנר" value={form.cover_url} onChange={v => setForm({ ...form, cover_url: v })} />
        <Field label="אינסטגרם" value={form.instagram} onChange={v => setForm({ ...form, instagram: v })} />
      </div>
      <label style={{ display: "block", marginTop: 12 }}>
        <span style={S.label}>אודות העסק</span>
        <textarea style={{ ...S.input, minHeight: 90 }} value={form.about || ""} onChange={e => setForm({ ...form, about: e.target.value })} />
      </label>
      <button style={{ ...S.btn, ...S.primary, marginTop: 12 }} onClick={() => updateBusiness(form)}>שמור הגדרות</button>
    </div>

    <div style={S.card}>
      <h2 style={{ marginTop: 0 }}>תמונות העסק</h2>
      <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 14 }}>
        בעל העסק יכול לבחור תמונות ישירות מהגלריה של הפלאפון. התמונות נשמרות ב־Supabase Storage ומופיעות אוטומטית בפרופיל העסק.
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <ImageUploadBox
          title="לוגו / תמונת פרופיל"
          desc="תמונה קטנה שמופיעה בכרטיס העסק ובפרופיל"
          preview={form.logo_url}
          loading={loading}
          onUpload={(file) => uploadBusinessImage(file, "logo_url")}
        />
        <ImageUploadBox
          title="באנר עסק"
          desc="תמונה רחבה שמופיעה בראש פרופיל העסק"
          preview={form.cover_url || form.banner_url}
          loading={loading}
          onUpload={(file) => uploadBusinessImage(file, "cover_url")}
        />
        <ImageUploadBox
          title="גלריית תמונות"
          desc="אפשר לבחור כמה תמונות של העסק, עבודות, לפני/אחרי וכו׳"
          loading={loading}
          multiple
          onUpload={(file) => uploadBusinessImage(file, "gallery", true)}
        />
      </div>

      {gallery.length > 0 && <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>תמונות בגלריה</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 10 }}>
          {gallery.map((img, i) => <div key={i} style={{ height: 92, borderRadius: 14, background: `url(${img}) center/cover`, border: "1px solid #ede9fe" }} />)}
        </div>
      </div>}
    </div>
  </div>;
}
function Employees({ employees, newEmployee, setNewEmployee, addEmployee, removeEmployee }) { return <div style={S.card}><h2>עובדים</h2><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 14 }}><input style={S.input} placeholder="שם" value={newEmployee.name} onChange={e => setNewEmployee({ ...newEmployee, name: e.target.value })} /><input style={S.input} placeholder="תפקיד" value={newEmployee.role} onChange={e => setNewEmployee({ ...newEmployee, role: e.target.value })} /><input style={S.input} placeholder="טלפון" value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} /><button style={{ ...S.btn, ...S.primary }} onClick={addEmployee}>הוסף</button></div>{arr(employees).map(e => <div key={e.id} style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}><span><b>{e.name}</b> · {e.role} · {e.phone}</span><button style={{ ...S.btn, ...S.danger }} onClick={() => removeEmployee(e.id)}>השבת</button></div>)}</div>; }
function Services({ services, employees, newService, setNewService, addService, removeService }) { return <div style={S.card}><h2>שירותים ומחירים</h2><div style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px 100px 160px auto", gap: 8, marginBottom: 14 }}><input style={S.input} value={newService.emoji} onChange={e => setNewService({ ...newService, emoji: e.target.value })} /><input style={S.input} placeholder="שם שירות" value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} /><input style={S.input} type="number" value={newService.duration} onChange={e => setNewService({ ...newService, duration: Number(e.target.value) })} /><input style={S.input} type="number" value={newService.price} onChange={e => setNewService({ ...newService, price: Number(e.target.value) })} /><select style={S.input} value={newService.employee_id} onChange={e => setNewService({ ...newService, employee_id: e.target.value })}><option value="">כל עובד</option>{arr(employees).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select><button style={{ ...S.btn, ...S.primary }} onClick={addService}>הוסף</button></div>{arr(services).map(s => <div key={s.id} style={{ padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" }}><span>{s.emoji} <b>{s.name}</b> · {s.duration} דק׳ · ₪{s.price}</span><button style={{ ...S.btn, ...S.danger }} onClick={() => removeService(s.id)}>מחק</button></div>)}</div>; }
function Availability({ availability, updateAvailability, breaks, addBreak, newBreak, setNewBreak, daysOff, addDayOff, newDayOff, setNewDayOff }) { const rows = arr(DAYS).map((d, i) => arr(availability).find(r => r?.day_of_week === i) || { day_of_week: i, is_open: i !== 6, start_time: "09:00", end_time: i === 5 ? "14:00" : "18:00", slot_minutes: 30 }); return <div style={{ display: "grid", gap: 16 }}><div style={S.card}><h2>זמינות שבועית</h2>{rows.map(r => <div key={r.day_of_week} style={{ display: "grid", gridTemplateColumns: "50px 100px 1fr 1fr 1fr auto", gap: 8, alignItems: "center", marginBottom: 8 }}><b>{DAYS[r.day_of_week]}</b><label><input type="checkbox" checked={!!r.is_open} onChange={e => updateAvailability({ ...r, is_open: e.target.checked })} /> פתוח</label><select style={S.input} value={safeTime(r.start_time)} onChange={e => updateAvailability({ ...r, start_time: e.target.value })}>{arr(TIMES).map(t => <option key={t}>{t}</option>)}</select><select style={S.input} value={safeTime(r.end_time)} onChange={e => updateAvailability({ ...r, end_time: e.target.value })}>{arr(TIMES).map(t => <option key={t}>{t}</option>)}</select><select style={S.input} value={r.slot_minutes || 30} onChange={e => updateAvailability({ ...r, slot_minutes: Number(e.target.value) })}><option value="15">15 דק׳</option><option value="30">30 דק׳</option><option value="60">60 דק׳</option></select><button style={{ ...S.btn, ...S.ghost }} onClick={() => updateAvailability(r)}>שמור</button></div>)}</div><div style={S.card}><h2>הפסקות קבועות</h2><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr auto", gap: 8 }}><select style={S.input} value={newBreak.day_of_week} onChange={e => setNewBreak({ ...newBreak, day_of_week: Number(e.target.value) })}>{arr(DAYS).map((d, i) => <option key={d} value={i}>{d}</option>)}</select><input style={S.input} value={newBreak.start_time} onChange={e => setNewBreak({ ...newBreak, start_time: e.target.value })} /><input style={S.input} value={newBreak.end_time} onChange={e => setNewBreak({ ...newBreak, end_time: e.target.value })} /><input style={S.input} value={newBreak.title} onChange={e => setNewBreak({ ...newBreak, title: e.target.value })} /><button style={{ ...S.btn, ...S.primary }} onClick={addBreak}>הוסף</button></div>{arr(breaks).map(b => <div key={b.id} style={{ padding: 8 }}>{DAYS[b.day_of_week]} · {safeTime(b.start_time)}-{safeTime(b.end_time)} · {b.title}</div>)}</div><div style={S.card}><h2>חופשות וימים סגורים</h2><div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8 }}><input style={S.input} type="date" value={newDayOff.date} onChange={e => setNewDayOff({ ...newDayOff, date: e.target.value })} /><input style={S.input} placeholder="סיבה" value={newDayOff.reason} onChange={e => setNewDayOff({ ...newDayOff, reason: e.target.value })} /><button style={{ ...S.btn, ...S.primary }} onClick={addDayOff}>הוסף</button></div>{arr(daysOff).map(d => <div key={d.id} style={{ padding: 8 }}>{d.date} · {d.reason}</div>)}</div></div>; }
function Billing({ subscription, startCheckout, loading }) { const active = isActiveSubscription(subscription); return <div style={S.card}><h2>מנוי ותשלום</h2><div style={{ padding: 12, borderRadius: 12, background: active ? "#dcfce7" : "#fee2e2", color: active ? "#166534" : "#991b1b", marginBottom: 16, fontWeight: 900 }}>{active ? `מנוי פעיל: ${subscription.plan_id}` : "אין מנוי פעיל — עמוד ההזמנות נעול"}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>{arr(PLANS).map(p => <div key={p.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 16 }}><div style={{ fontWeight: 900, fontSize: 20 }}>{p.name}</div><div style={{ color: "#7c3aed", fontSize: 30, fontWeight: 900 }}>₪{p.price}</div><div style={{ color: "#6b7280" }}>לחודש</div><ul>{arr(p?.features).map(f => <li key={f}>{f}</li>)}</ul><button style={{ ...S.btn, ...S.primary, width: "100%" }} disabled={loading} onClick={() => startCheckout(p.id)}>בחר חבילה</button></div>)}</div></div>; }
