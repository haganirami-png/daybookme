/* eslint-disable */
"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

const DAY_MAP = { 0:"א׳", 1:"ב׳", 2:"ג׳", 3:"ד׳", 4:"ה׳", 5:"ו׳", 6:"ש׳" };
const MONTH_MAP = ["ינו׳","פבר׳","מרץ","אפר׳","מאי","יוני","יולי","אוג׳","ספט׳","אוק׳","נוב׳","דצמ׳"];

function getDatesAhead(n) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    dates.push({
      date: d.toISOString().split("T")[0],
      label: DAY_MAP[d.getDay()],
      dayNum: d.getDate(),
      month: MONTH_MAP[d.getMonth()],
      dayOfWeek: d.getDay(), // 0=Sun
    });
  }
  return dates;
}

// "09:00" + 75 mins => "10:15"
function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`;
}

// "09:00" < "10:00" => true
function timeBefore(a, b) {
  return a.replace(":","") < b.replace(":","");
}

// Generate time slots from start to end every slotMins, excluding booked
function generateSlots(startTime, endTime, slotMins, duration, bookedSlots) {
  const slots = [];
  let cur = startTime;
  while (timeBefore(cur, endTime)) {
    const end = addMinutes(cur, duration);
    if (!timeBefore(end, endTime) && end !== endTime) { cur = addMinutes(cur, slotMins); continue; }
    // Check conflicts
    const conflict = bookedSlots.some(b => {
      // booked: { time, duration } — slot conflicts if it overlaps
      const bEnd = addMinutes(b.time, b.duration + (b.buffer || 10));
      return cur < bEnd && end > b.time;
    });
    if (!conflict) slots.push(cur);
    cur = addMinutes(cur, slotMins);
  }
  return slots;
}

const S = {
  page: { fontFamily:"Heebo, Assistant, Arial, sans-serif", direction:"rtl", minHeight:"100vh", background:"linear-gradient(180deg,#f8fafc 0%,#eef2ff 42%,#f8fafc 100%)", color:"#0f172a" },
  wrap: { maxWidth:540, margin:"0 auto", padding:"18px 18px 60px" },
  card: { background:"rgba(255,255,255,.95)", border:"1px solid rgba(226,232,240,.9)", borderRadius:24, boxShadow:"0 18px 45px rgba(15,23,42,.08)" },
  btn: { border:0, borderRadius:16, padding:"14px 20px", fontWeight:900, cursor:"pointer", fontFamily:"inherit", fontSize:15 },
  primary: { background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white" },
  ghost: { background:"rgba(15,23,42,.06)", color:"#334155" },
};

const DAYS = getDatesAhead(14);

function BookPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get("business_id");

  const [step, setStep] = useState(0);
  const [business, setBusiness] = useState(null);
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availability, setAvailability] = useState([]);

  const [service, setService] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (businessId) loadData(); }, [businessId]);

  async function loadData() {
    setLoading(true);
    const [{ data: biz }, { data: svcs }, { data: emps }, { data: avail }] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).single(),
      supabase.from("business_services").select("*").eq("business_id", businessId).eq("is_active", true),
      supabase.from("employees").select("*").eq("business_id", businessId).eq("status", "active"),
      supabase.from("business_availability").select("*").eq("business_id", businessId),
    ]);
    setBusiness(biz);
    setServices(Array.isArray(svcs) ? svcs : []);
    setEmployees(Array.isArray(emps) ? emps : []);
    setAvailability(Array.isArray(avail) ? avail : []);
    setLoading(false);
  }

  async function selectEmployee(emp) {
    setEmployee(emp);
    setDate(null);
    setSlot(null);
    setBookedSlots([]);
    setStep(2);
  }

  async function selectDate(dateObj) {
    setDate(dateObj);
    setSlot(null);
    // Load existing appointments for this employee on this date
    const { data } = await supabase
      .from("appointments")
      .select("time, duration")
      .eq("business_id", businessId)
      .eq("employee_id", employee.id)
      .eq("date", dateObj.date)
      .in("status", ["confirmed", "pending"]);
    setBookedSlots(Array.isArray(data) ? data : []);
  }

  // Get availability for a given day of week
  function getAvailForDay(dayOfWeek) {
    // business_availability: day_of_week 0=Sun
    return availability.find(a => a.day_of_week === dayOfWeek && a.is_open);
  }

  // Check employee works on this day
  function employeeWorksOnDay(emp, dayOfWeek) {
    if (!emp.work_days) return true; // no restriction
    // work_days is ARRAY e.g. ["0","1","2"] or [0,1,2]
    return emp.work_days.map(String).includes(String(dayOfWeek));
  }

  function getSlotsForDate(dateObj) {
    if (!employee || !service) return [];
    const avail = getAvailForDay(dateObj.dayOfWeek);
    if (!avail) return [];
    if (!employeeWorksOnDay(employee, dateObj.dayOfWeek)) return [];
    const empStart = employee.work_start || avail.start_time;
    const empEnd = employee.work_end || avail.end_time;
    const slotMins = avail.slot_minutes || 30;
    return generateSlots(empStart, empEnd, slotMins, service.duration_minutes || 60, bookedSlots);
  }

  async function handleSubmit() {
    if (!clientName.trim() || !clientPhone.trim()) return;
    setSubmitting(true);
    setError("");
    const { error: err } = await supabase.from("appointments").insert({
      business_id: businessId,
      employee_id: employee.id,
      client_name: clientName.trim(),
      client_phone: clientPhone.trim(),
      service: service.name,
      date: date.date,
      time: slot,
      duration: service.duration_minutes || 60,
      price: service.price || 0,
      status: "pending",
      notes: "",
    });
    if (err) { setError("אירעה שגיאה, נסה שוב."); setSubmitting(false); return; }
    setDone(true);
    setSubmitting(false);
  }

  if (!businessId) return <CenteredMsg icon="😕" title="לא סופק מזהה עסק" btn="בית" onBtn={() => router.push("/")} />;
  if (loading) return <CenteredMsg icon="📅" title="טוען..." />;
  if (!business) return <CenteredMsg icon="😕" title="העסק לא נמצא" btn="בית" onBtn={() => router.push("/")} />;
  if (done) return <ConfirmScreen business={business} service={service} employee={employee} date={date} slot={slot} clientName={clientName} onHome={() => router.push("/")} />;

  const steps = ["שירות","עובד","תאריך ושעה","אישור"];

  return (
    <div style={S.page}>
      <div style={S.wrap}>
        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <button style={{ ...S.btn, ...S.ghost, padding:"10px 14px" }}
            onClick={() => step === 0 ? router.back() : setStep(step - 1)}>→</button>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:900, fontSize:18 }}>{business.name}</div>
            <div style={{ fontSize:12, color:"#64748b", fontWeight:700 }}>{business.category}</div>
          </div>
        </div>

        {/* Step bar */}
        <div style={{ display:"flex", gap:6, marginBottom:28 }}>
          {steps.map((s,i) => (
            <div key={i} style={{ flex:1 }}>
              <div style={{ height:4, borderRadius:4, background: i<=step ? "linear-gradient(90deg,#7c3aed,#4f46e5)" : "#e2e8f0", transition:"background .3s" }}/>
              <div style={{ fontSize:10, color: i===step ? "#7c3aed" : "#94a3b8", marginTop:5, textAlign:"center", fontWeight:900 }}>{s}</div>
            </div>
          ))}
        </div>

        {/* STEP 0 — Service */}
        {step === 0 && (
          <div>
            <h2 style={{ marginBottom:6 }}>בחר שירות</h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:20, fontWeight:700 }}>{services.length} שירותים זמינים</p>
            {services.length === 0
              ? <div style={{ ...S.card, padding:28, textAlign:"center", color:"#64748b" }}>אין שירותים פעילים</div>
              : <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {services.map(svc => (
                    <div key={svc.id} onClick={() => { setService(svc); setStep(1); }}
                      style={{ ...S.card, padding:"18px 20px", display:"flex", alignItems:"center", gap:16, cursor:"pointer",
                        border: service?.id===svc.id ? "2px solid #7c3aed" : "1px solid rgba(226,232,240,.9)" }}>
                      <div style={{ width:46, height:46, borderRadius:14, background:"#eef2ff", display:"grid", placeItems:"center", fontSize:22 }}>
                        {svc.emoji || "✨"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:900, fontSize:16 }}>{svc.name}</div>
                        <div style={{ color:"#64748b", fontSize:13, fontWeight:700, marginTop:3 }}>
                          {svc.duration_minutes || "?"} דקות{svc.description ? ` • ${svc.description}` : ""}
                        </div>
                      </div>
                      {svc.price != null && <div style={{ fontWeight:900, fontSize:17, color:"#7c3aed" }}>₪{svc.price}</div>}
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* STEP 1 — Employee */}
        {step === 1 && (
          <div>
            <h2 style={{ marginBottom:6 }}>בחר עובד/ת</h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:20, fontWeight:700 }}>כולם זמינים לשירות שנבחר</p>
            {employees.length === 0
              ? <div style={{ ...S.card, padding:28, textAlign:"center", color:"#64748b" }}>אין עובדים פעילים</div>
              : <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {employees.map(emp => (
                    <div key={emp.id} onClick={() => selectEmployee(emp)}
                      style={{ ...S.card, padding:"18px 20px", display:"flex", alignItems:"center", gap:16, cursor:"pointer",
                        border: employee?.id===emp.id ? "2px solid #7c3aed" : "1px solid rgba(226,232,240,.9)" }}>
                      <div style={{ width:50, height:50, borderRadius:"50%",
                        background: emp.color ? `${emp.color}22` : "#eef2ff",
                        border: `2px solid ${emp.color || "#c4b5fd"}`,
                        display:"grid", placeItems:"center", fontSize:20, fontWeight:900,
                        color: emp.color || "#7c3aed" }}>
                        {emp.name?.[0] || "?"}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:900, fontSize:16 }}>{emp.name}</div>
                        <div style={{ color:"#64748b", fontSize:13, fontWeight:700, marginTop:3 }}>{emp.role || "עובד/ת"}</div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        )}

        {/* STEP 2 — Date & Time */}
        {step === 2 && (
          <div>
            <h2 style={{ marginBottom:6 }}>בחר תאריך ושעה</h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:20, fontWeight:700 }}>14 ימים קדימה</p>

            {/* Date strip */}
            <div style={{ display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:24 }}>
              {DAYS.map(d => {
                const avail = getAvailForDay(d.dayOfWeek);
                const works = employeeWorksOnDay(employee, d.dayOfWeek);
                const disabled = !avail || !works;
                return (
                  <div key={d.date} onClick={() => !disabled && selectDate(d)}
                    style={{ minWidth:58, padding:"12px 6px", borderRadius:16, textAlign:"center",
                      cursor: disabled ? "default" : "pointer", userSelect:"none",
                      opacity: disabled ? .35 : 1,
                      background: date?.date===d.date ? "linear-gradient(135deg,#7c3aed,#4f46e5)" : "rgba(255,255,255,.95)",
                      border: date?.date===d.date ? "none" : "1px solid #e2e8f0",
                      color: date?.date===d.date ? "white" : "#0f172a",
                      boxShadow: date?.date===d.date ? "0 8px 20px rgba(124,58,237,.3)" : "none",
                      transition:"all .2s" }}>
                    <div style={{ fontSize:11, fontWeight:900, opacity:.75 }}>{d.label}</div>
                    <div style={{ fontSize:20, fontWeight:900, margin:"4px 0 2px" }}>{d.dayNum}</div>
                    <div style={{ fontSize:11, fontWeight:900, opacity:.75 }}>{d.month}</div>
                  </div>
                );
              })}
            </div>

            {/* Time slots */}
            {date && (() => {
              const slots = getSlotsForDate(date);
              return (
                <div>
                  <div style={{ fontWeight:900, marginBottom:12, fontSize:14, color:"#64748b" }}>
                    שעות פנויות ({slots.length})
                  </div>
                  {slots.length === 0
                    ? <div style={{ ...S.card, padding:24, textAlign:"center", color:"#64748b" }}>אין תורים פנויים ביום זה</div>
                    : <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
                        {slots.map(t => (
                          <button key={t} onClick={() => setSlot(t)}
                            style={{ border: slot===t ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                              borderRadius:12, padding:"11px 4px", fontWeight:900, fontSize:14,
                              cursor:"pointer", fontFamily:"inherit",
                              background: slot===t ? "#eef2ff" : "rgba(255,255,255,.95)",
                              color: slot===t ? "#7c3aed" : "#0f172a", transition:"all .15s" }}>
                            {t}
                          </button>
                        ))}
                      </div>
                  }
                  {slot && (
                    <div style={{ marginTop:16, padding:"14px 16px", background:"#eef2ff", borderRadius:14, fontSize:13, fontWeight:700, color:"#4f46e5" }}>
                      יסתיים ב-{addMinutes(slot, service.duration_minutes || 60)}
                    </div>
                  )}
                </div>
              );
            })()}

            <button style={{ ...S.btn, ...S.primary, width:"100%", marginTop:24, opacity: slot ? 1 : .45 }}
              disabled={!slot} onClick={() => setStep(3)}>המשך</button>
          </div>
        )}

        {/* STEP 3 — Confirm */}
        {step === 3 && (
          <div>
            <h2 style={{ marginBottom:6 }}>אישור הזמנה</h2>
            <p style={{ color:"#64748b", fontSize:14, marginBottom:20, fontWeight:700 }}>בדוק ואשר</p>

            <div style={{ ...S.card, padding:"20px", marginBottom:20 }}>
              {[
                { label:"שירות", value: service.name },
                { label:"עובד/ת", value: employee.name },
                { label:"תאריך", value: `${date.dayNum} ${date.month}` },
                { label:"שעה", value: `${slot} — ${addMinutes(slot, service.duration_minutes||60)}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:12, fontSize:14 }}>
                  <span style={{ color:"#64748b", fontWeight:700 }}>{label}</span>
                  <span style={{ fontWeight:900 }}>{value}</span>
                </div>
              ))}
              <div style={{ height:1, background:"#e2e8f0", margin:"12px 0" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:15 }}>
                <span style={{ color:"#64748b", fontWeight:700 }}>מחיר</span>
                <span style={{ fontWeight:900, color:"#7c3aed", fontSize:18 }}>
                  {service.price != null ? `₪${service.price}` : "לפי הסכמה"}
                </span>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="שם מלא *"
                style={{ border:"1px solid #e2e8f0", borderRadius:14, padding:"14px 16px", fontSize:15, fontFamily:"inherit", outline:"none", direction:"rtl" }}/>
              <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="מספר טלפון *" type="tel"
                style={{ border:"1px solid #e2e8f0", borderRadius:14, padding:"14px 16px", fontSize:15, fontFamily:"inherit", outline:"none", direction:"rtl" }}/>
            </div>

            {error && (
              <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:12, padding:"12px 16px", color:"#dc2626", fontSize:14, fontWeight:700, marginBottom:16 }}>
                {error}
              </div>
            )}

            <button style={{ ...S.btn, ...S.primary, width:"100%", opacity: submitting||!clientName.trim()||!clientPhone.trim() ? .45 : 1 }}
              disabled={submitting||!clientName.trim()||!clientPhone.trim()} onClick={handleSubmit}>
              {submitting ? "שומר..." : "אישור הזמנה"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CenteredMsg({ icon, title, btn, onBtn }) {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Heebo,sans-serif", direction:"rtl" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:12 }}>{icon}</div>
        <div style={{ fontWeight:900, fontSize:18, marginBottom: btn ? 20 : 0 }}>{title}</div>
        {btn && <button onClick={onBtn} style={{ border:0, borderRadius:16, padding:"13px 24px", fontWeight:900, cursor:"pointer", fontFamily:"inherit", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white" }}>{btn}</button>}
      </div>
    </div>
  );
}

function ConfirmScreen({ business, service, employee, date, slot, clientName, onHome }) {
  function addMinutes(timeStr, mins) {
    const [h, m] = timeStr.split(":").map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total/60)).padStart(2,"0")}:${String(total%60).padStart(2,"0")}`;
  }
  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(180deg,#f8fafc,#eef2ff,#f8fafc)", fontFamily:"Heebo,sans-serif", direction:"rtl", display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <style>{`@keyframes pop{0%{transform:scale(.5);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}`}</style>
      <div style={{ textAlign:"center", maxWidth:380, width:"100%" }}>
        <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", display:"grid", placeItems:"center", margin:"0 auto 24px", fontSize:36, animation:"pop .5s cubic-bezier(.36,.07,.19,.97) both" }}>✓</div>
        <h1 style={{ fontSize:28, fontWeight:900, marginBottom:8 }}>הוזמן בהצלחה!</h1>
        <p style={{ color:"#64748b", fontWeight:700, marginBottom:28 }}>נשמח לראות אותך, {clientName}</p>
        <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:20, padding:"20px 24px", marginBottom:24, textAlign:"right" }}>
          {[
            { label:"עסק", value: business.name },
            { label:"שירות", value: service.name },
            { label:"עובד/ת", value: employee.name },
            { label:"תאריך", value: `${date.dayNum} ${date.month}` },
            { label:"שעה", value: `${slot} — ${addMinutes(slot, service.duration_minutes||60)}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:14 }}>
              <span style={{ color:"#64748b", fontWeight:700 }}>{label}</span>
              <span style={{ fontWeight:900 }}>{value}</span>
            </div>
          ))}
        </div>
        <button onClick={onHome} style={{ border:0, borderRadius:16, padding:"14px 28px", fontWeight:900, cursor:"pointer", fontFamily:"inherit", background:"linear-gradient(135deg,#7c3aed,#4f46e5)", color:"white", width:"100%", fontSize:15 }}>
          חזור לדף הבית
        </button>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<CenteredMsg icon="📅" title="טוען..." />}>
      <BookPageInner />
    </Suspense>
  );
}
