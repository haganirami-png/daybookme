/* eslint-disable */
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const DEFAULT_BUSINESS_ID = "eec5bb09-33e3-44e6-a4e7-1447dad5a5c7";
const DAY_NAMES = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const S = {
  app: { fontFamily: "Heebo, Arial, sans-serif", direction: "rtl", background: "#fafafa", minHeight: "100vh", maxWidth: 460, margin: "0 auto", color: "#111827" },
  header: { color: "white", padding: "54px 20px 22px", background: "linear-gradient(135deg,#7c3aed,#4f46e5)" },
  card: { background: "white", border: "1px solid #eee", borderRadius: 16, padding: 14, marginBottom: 10, boxShadow: "0 2px 10px rgba(0,0,0,.03)" },
  input: { width: "100%", padding: "13px 14px", border: "1px solid #ddd", borderRadius: 12, fontSize: 15, boxSizing: "border-box", fontFamily: "inherit" },
  btn: { border: 0, borderRadius: 14, padding: "14px 18px", fontWeight: 900, fontFamily: "inherit", cursor: "pointer" },
  primary: { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white" },
  ghost: { background: "#f3f4f6", color: "#374151" },
  title: { fontSize: 17, fontWeight: 900, margin: "18px 0 12px" },
};

function fmtDate(d) { return d.toISOString().slice(0, 10); }
function dateLabel(iso, i) { if (i === 0) return "היום"; if (i === 1) return "מחר"; const [, m, d] = iso.split("-"); return `${Number(d)}/${Number(m)}`; }
function timeToMin(t) { const [h, m] = String(t || "00:00").slice(0,5).split(":").map(Number); return h * 60 + m; }
function minToTime(m) { return `${String(Math.floor(m / 60)).padStart(2,"0")}:${String(m % 60).padStart(2,"0")}`; }
function isSubActive(sub) { return sub && ["active", "trialing"].includes(sub.status) && (!sub.current_period_end || new Date(sub.current_period_end) > new Date()); }

export default function BookPage() {
  const [mounted, setMounted] = useState(false);
  const [businessId, setBusinessId] = useState(DEFAULT_BUSINESS_ID);
  const [business, setBusiness] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [daysOff, setDaysOff] = useState([]);
  const [booked, setBooked] = useState([]);
  const [step, setStep] = useState("service");
  const [selectedService, setSelectedService] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [client, setClient] = useState({ name: "", phone: "", note: "" });
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [myAppts, setMyAppts] = useState([]);
  const [view, setView] = useState("book");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setBusinessId(params.get("business_id") || DEFAULT_BUSINESS_ID);
    const savedPhone = localStorage.getItem("clientPhone");
    if (savedPhone) { setClient(p => ({ ...p, phone: savedPhone })); loadMy(savedPhone, params.get("business_id") || DEFAULT_BUSINESS_ID); }
    setMounted(true);
  }, []);
  useEffect(() => { if (businessId) loadBusinessData(businessId); }, [businessId]);
  useEffect(() => { if (selectedDate && businessId) loadBooked(selectedDate); }, [selectedDate, businessId]);

  async function loadBusinessData(id) {
    const [{ data: b }, { data: sub }, { data: svc }, { data: emp }, { data: av }, { data: br }, { data: off }] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", id).maybeSingle(),
      supabase.from("business_subscriptions").select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("business_services").select("*").eq("business_id", id).eq("is_active", true).order("created_at"),
      supabase.from("employees").select("*").eq("business_id", id).eq("status", "active").order("created_at"),
      supabase.from("business_availability").select("*").eq("business_id", id),
      supabase.from("business_breaks").select("*").eq("business_id", id),
      supabase.from("business_days_off").select("*").eq("business_id", id),
    ]);
    setBusiness(b || null); setSubscription(sub || null); setServices(svc || []); setEmployees(emp || []); setAvailability(av || []); setBreaks(br || []); setDaysOff(off || []);
  }
  async function loadBooked(date) { const { data } = await supabase.from("appointments").select("time").eq("business_id", businessId).eq("date", date).neq("status", "cancelled"); setBooked((data || []).map(x => String(x.time).slice(0,5))); }
  async function loadMy(phone, id = businessId) { const { data } = await supabase.from("appointments").select("*").eq("business_id", id).eq("client_phone", phone).order("created_at", { ascending: false }); setMyAppts(data || []); }

  const dates = useMemo(() => Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); const iso = fmtDate(d); return { iso, label: dateLabel(iso, i), day: DAY_NAMES[d.getDay()] }; }), []);
  const availableTimes = useMemo(() => {
    if (!selectedDate) return [];
    if (daysOff.some(d => d.date === selectedDate)) return [];
    const d = new Date(`${selectedDate}T12:00:00`);
    const rule = availability.find(r => r.day_of_week === d.getDay());
    if (!rule || !rule.is_open) return [];
    const slot = Number(rule.slot_minutes || 30);
    const dur = Number(selectedService?.duration || 30);
    const start = timeToMin(rule.start_time), end = timeToMin(rule.end_time);
    const dayBreaks = breaks.filter(b => b.day_of_week === d.getDay()).map(b => [timeToMin(b.start_time), timeToMin(b.end_time)]);
    const out = [];
    for (let m = start; m + dur <= end; m += slot) {
      const t = minToTime(m);
      const blockedByBreak = dayBreaks.some(([bs, be]) => m < be && m + dur > bs);
      if (!blockedByBreak && !booked.includes(t)) out.push(t);
    }
    return out;
  }, [selectedDate, availability, breaks, daysOff, booked, selectedService]);
  const relevantEmployees = useMemo(() => selectedService?.employee_id ? employees.filter(e => e.id === selectedService.employee_id) : employees, [employees, selectedService]);

  // ── TWILIO OTP ──
  async function sendOtp() {
    const phone = String(client.phone).replace(/\D/g, "");
    if (phone.length < 9) return alert("נא להזין מספר טלפון תקין");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: client.phone, action: "send" }),
      });
      const data = await res.json();
      if (data.ok) {
        setOtpSent(true);
        setOtpInput("");
        setOtpVerified(false);
      } else {
        alert("שגיאה בשליחת SMS: " + (data.error || "נסה שוב"));
      }
    } catch (e) {
      alert("שגיאה בשליחת SMS");
    } finally {
      setOtpLoading(false);
    }
  }

  async function verifyOtp() {
    if (!otpInput || otpInput.length < 4) return alert("הכנס את הקוד שנשלח");
    setOtpLoading(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: client.phone, action: "verify", code: otpInput }),
      });
      const data = await res.json();
      if (data.ok) {
        setOtpVerified(true);
        localStorage.setItem("clientPhone", client.phone);
      } else {
        alert("קוד האימות לא נכון, נסה שוב");
      }
    } catch (e) {
      alert("שגיאה באימות");
    } finally {
      setOtpLoading(false);
    }
  }

  async function confirmBooking() {
    if (!isSubActive(subscription)) return alert("העסק עדיין לא פעיל לקבלת תורים");
    if (!otpVerified) return alert("צריך לאמת את מספר הטלפון לפני קביעת תור");
    setLoading(true);
    const { data, error } = await supabase.from("appointments").insert({
      business_id: businessId,
      employee_id: selectedEmployee?.id || selectedService?.employee_id || null,
      client_name: client.name,
      client_phone: client.phone,
      service: selectedService.name,
      date: selectedDate,
      time: selectedTime,
      duration: selectedService.duration,
      notes: client.note || "",
      status: "confirmed",
    }).select().single();
    setLoading(false);
    if (error) return alert("שגיאה בקביעת התור");
    localStorage.setItem("clientPhone", client.phone);
    setMyAppts(p => [data, ...p]); setBooked(p => [...p, selectedTime]); setStep("success");
  }

  if (!mounted) return null;
  if (!business) return <Shell title="DayBookMe"><div style={S.card}>העסק לא נמצא או שהקישור לא תקין.</div></Shell>;
  const locked = !isSubActive(subscription);

  if (view === "my") return <Shell business={business} title="התורים שלי"><button style={{...S.btn,...S.ghost, marginBottom:12}} onClick={() => setView("book")}>← חזור להזמנה</button>{myAppts.length === 0 ? <div style={S.card}>אין תורים למספר הזה.</div> : myAppts.map(a => <div key={a.id} style={S.card}><b>{a.service}</b><div>{a.date} · {String(a.time).slice(0,5)} · {a.status}</div><div style={{ color: "#6b7280" }}>{business.name}</div></div>)}</Shell>;

  if (locked) return <Shell business={business} title={business.name}><div style={{...S.card, background:"#fff7f7", borderColor:"#fecaca"}}><b>עמוד ההזמנות נעול כרגע.</b><br/>העסק עדיין לא הפעיל מנוי, ולכן אי אפשר לקבוע תורים דרך האפליקציה.</div></Shell>;

  return <Shell business={business} title={business.name} right={<button style={{...S.btn, background:"rgba(255,255,255,.18)", color:"white"}} onClick={() => { loadMy(client.phone); setView("my"); }}>📋 התורים שלי</button>}>
    {step === "service" && <><div style={S.title}>בחר שירות</div>{services.length === 0 ? <div style={S.card}>העסק עדיין לא הגדיר שירותים.</div> : services.map(s => <div key={s.id} style={{...S.card, borderColor: selectedService?.id === s.id ? "#7c3aed" : "#eee", cursor:"pointer"}} onClick={() => { setSelectedService(s); setSelectedEmployee(null); }}><div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}><div><b>{s.emoji} {s.name}</b><div style={{color:"#6b7280", fontSize:13}}>{s.duration} דקות</div></div><b style={{color:"#7c3aed"}}>₪{s.price}</b></div></div>)}<Sticky disabled={!selectedService} onClick={() => setStep("employee")}>המשך</Sticky></>}
    {step === "employee" && <><button style={{...S.btn,...S.ghost}} onClick={() => setStep("service")}>← חזור</button><div style={S.title}>בחר עובד</div>{relevantEmployees.length === 0 && <div style={S.card}>אין עובדים מוגדרים. אפשר להמשיך ללא בחירת עובד.</div>}{relevantEmployees.map(e => <div key={e.id} style={{...S.card, borderColor:selectedEmployee?.id===e.id?"#7c3aed":"#eee"}} onClick={() => setSelectedEmployee(e)}><b>{e.name}</b><div style={{color:"#6b7280"}}>{e.role}</div></div>)}<div style={{...S.card, borderStyle:"dashed"}} onClick={() => setSelectedEmployee({ id:null, name:"ללא העדפה" })}>אין לי העדפה</div><Sticky disabled={!selectedEmployee && relevantEmployees.length>0} onClick={() => setStep("date")}>המשך לתאריך</Sticky></>}
    {step === "date" && <><button style={{...S.btn,...S.ghost}} onClick={() => setStep("employee")}>← חזור</button><div style={S.title}>בחר תאריך</div><div style={{display:"flex", gap:8, overflowX:"auto", marginBottom:12}}>{dates.map(d => <button key={d.iso} style={{...S.btn, minWidth:68, ...(selectedDate===d.iso?S.primary:S.ghost)}} onClick={() => { setSelectedDate(d.iso); setSelectedTime(null); }}>{d.day}<br/>{d.label}</button>)}</div>{selectedDate && <><div style={S.title}>שעות פנויות</div><div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8}}>{availableTimes.map(t => <button key={t} style={{...S.btn, ...(selectedTime===t?S.primary:S.ghost)}} onClick={() => setSelectedTime(t)}>{t}</button>)}</div>{availableTimes.length===0 && <div style={S.card}>אין שעות פנויות ביום הזה</div>}</>}<Sticky disabled={!selectedDate || !selectedTime} onClick={() => setStep("details")}>המשך לפרטים</Sticky></>}
    {step === "details" && <>
      <button style={{...S.btn,...S.ghost}} onClick={() => setStep("date")}>← חזור</button>
      <div style={S.title}>פרטים אישיים</div>
      <div style={S.card}>
        <input style={{...S.input, marginBottom:10}} placeholder="שם מלא" value={client.name} onChange={e => setClient({...client, name:e.target.value})} />
        <input style={{...S.input, marginBottom:10, direction:"ltr"}} placeholder="טלפון" value={client.phone} onChange={e => { setClient({...client, phone:e.target.value}); setOtpSent(false); setOtpVerified(false); setOtpInput(""); }} />
        <textarea style={{...S.input, minHeight:70}} placeholder="הערה אופציונלית" value={client.note} onChange={e => setClient({...client, note:e.target.value})} />
        {!otpVerified ? (
          <div style={{marginTop:10}}>
            <button style={{...S.btn,...S.primary, width:"100%"}} onClick={sendOtp} disabled={otpLoading}>
              {otpLoading ? "שולח..." : otpSent ? "שלח קוד מחדש" : "שלח קוד אימות SMS"}
            </button>
            {otpSent && (
              <div style={{display:"grid", gap:8, marginTop:10}}>
                <div style={{fontSize:13,color:"#6b7280",textAlign:"center"}}>📱 הכנס את הקוד שנשלח ל-{client.phone}</div>
                <input style={{...S.input, direction:"ltr", textAlign:"center", fontSize:20, letterSpacing:8}} placeholder="000000" maxLength={6} value={otpInput} onChange={e => setOtpInput(e.target.value)} />
                <button style={{...S.btn,...S.ghost, width:"100%"}} onClick={verifyOtp} disabled={otpLoading}>
                  {otpLoading ? "מאמת..." : "✅ אמת טלפון"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{color:"#059669", fontWeight:900, marginTop:10, textAlign:"center"}}>✅ טלפון אומת בהצלחה!</div>
        )}
      </div>
      <Sticky disabled={!client.name || !client.phone || !otpVerified} onClick={() => setStep("confirm")}>המשך לאישור</Sticky>
    </>}
    {step === "confirm" && <><button style={{...S.btn,...S.ghost}} onClick={() => setStep("details")}>← חזור</button><div style={S.title}>אישור התור</div><div style={S.card}><h3>{selectedService.emoji} {selectedService.name}</h3><p>{selectedDate} · {selectedTime}</p><p>{selectedEmployee?.name || "ללא העדפה"}</p><p>{client.name} · {client.phone}</p><b>₪{selectedService.price}</b></div><Sticky disabled={loading} onClick={confirmBooking}>{loading ? "שומר..." : "✅ אשר תור"}</Sticky></>}
    {step === "success" && <div style={{ textAlign:"center", padding:"50px 20px" }}><div style={{fontSize:70}}>🎉</div><h2>התור נקבע ואושר!</h2><div style={S.card}>{selectedService.name}<br/>{selectedDate} · {selectedTime}</div><button style={{...S.btn,...S.primary, width:"100%"}} onClick={() => { loadMy(client.phone); setView("my"); }}>צפה בתורים שלי</button></div>}
  </Shell>;
}

function Shell({ business, title, children, right }) { return <div style={S.app}><div style={S.header}>{right && <div style={{float:"left"}}>{right}</div>}<div style={{fontSize: business?.logo_url ? 0 : 36, marginBottom:8}}>{business?.logo_url ? <img src={business.logo_url} style={{width:64,height:64,borderRadius:18,objectFit:"cover"}}/> : "📅"}</div><h1 style={{margin:0, fontSize:24}}>{title}</h1><div style={{opacity:.85, fontSize:13}}>{business?.address || ""}</div></div><main style={{padding:"16px 16px 100px"}}>{children}</main></div>; }
function Sticky({ disabled, onClick, children }) { return <div style={{position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:460, background:"white", padding:"12px 16px 24px", borderTop:"1px solid #eee"}}><button disabled={disabled} onClick={onClick} style={{...S.btn, ...(disabled ? {background:"#e5e7eb", color:"#9ca3af"}:S.primary), width:"100%"}}>{children}</button></div>; }
