"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const mockAppointments = [
  { id: 1, clientName: "דנה לוי", phone: "0501234567", service: "תספורת + צבע", date: "2026-05-28", time: "10:00", duration: 90, status: "confirmed", notes: "", callScheduled: true, employeeId: 1 },
  { id: 2, clientName: "מיכל כהן", phone: "0529876543", service: "מניקור", date: "2026-05-28", time: "12:00", duration: 45, status: "pending", notes: "", callScheduled: false, employeeId: 2 },
  { id: 3, clientName: "רונית שמיר", phone: "0545551234", service: "פדיקור", date: "2026-05-28", time: "14:00", duration: 60, status: "confirmed", notes: "לקוחה קבועה", callScheduled: false, employeeId: 1 },
  { id: 4, clientName: "יעל גולן", phone: "0537778899", service: "תספורת", date: "2026-05-29", time: "09:00", duration: 45, status: "confirmed", notes: "", callScheduled: false, employeeId: 3 },
  { id: 5, clientName: "אורית בן דוד", phone: "0583334455", service: "טיפול פנים", date: "2026-05-29", time: "11:00", duration: 60, status: "cancelled", notes: "", callScheduled: false, employeeId: 2 },
  { id: 6, clientName: "לימור זיו", phone: "0541234567", service: "צבע שיער", date: "2026-05-27", time: "10:00", duration: 90, status: "confirmed", notes: "", callScheduled: false, employeeId: 1 },
  { id: 7, clientName: "הדס כץ", phone: "0529876542", service: "גבות", date: "2026-05-27", time: "13:00", duration: 30, status: "confirmed", notes: "", callScheduled: false, employeeId: 2 },
];

const mockEmployees = [
  { id: 1, name: "שרה כהן", role: "ספרית בכירה", phone: "0521111111", avatar: "ש", color: "#7c3aed", payType: "hourly", hourlyRate: 55, salaryBase: 0, commissionPct: 0, workDays: ["א","ב","ג","ד","ה"], workStart: "08:00", workEnd: "17:00", hoursWorked: 92, status: "active",
    shifts: [
      { id: 1, date: "2026-05-26", start: "08:00", end: "17:00", hours: 9 },
      { id: 2, date: "2026-05-27", start: "08:00", end: "16:00", hours: 8 },
      { id: 3, date: "2026-05-28", start: "08:00", end: "17:00", hours: 9 },
    ]
  },
  { id: 2, name: "רחל לוי", role: "מניקוריסטית", phone: "0532222222", avatar: "ר", color: "#059669", payType: "commission", hourlyRate: 0, salaryBase: 4500, commissionPct: 20, workDays: ["ב","ג","ד","ה","ו"], workStart: "09:00", workEnd: "18:00", hoursWorked: 76, status: "active",
    shifts: [
      { id: 4, date: "2026-05-26", start: "09:00", end: "18:00", hours: 9 },
      { id: 5, date: "2026-05-27", start: "09:00", end: "17:00", hours: 8 },
    ]
  },
  { id: 3, name: "מיכל ברק", role: "קוסמטיקאית", phone: "0543333333", avatar: "מ", color: "#dc2626", payType: "salary", hourlyRate: 0, salaryBase: 7200, commissionPct: 0, workDays: ["א","ג","ה"], workStart: "10:00", workEnd: "19:00", hoursWorked: 48, status: "active",
    shifts: [
      { id: 6, date: "2026-05-25", start: "10:00", end: "19:00", hours: 9 },
      { id: 7, date: "2026-05-27", start: "10:00", end: "18:00", hours: 8 },
    ]
  },
];

const services = ["תספורת","צבע שיער","תספורת + צבע","מניקור","פדיקור","טיפול פנים","עיסוי","גבות","ריסים"];
const shiftHours = ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];
const hebrewMonths = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
const allDays = ["א","ב","ג","ד","ה","ו","ש"];
const payTypeLabel = { hourly: "⏱ שעתי", salary: "📋 משכורת קבועה", commission: "💹 בסיס + עמלה" };
const COLORS = ["#7c3aed","#059669","#dc2626","#d97706","#0891b2","#be185d","#0d9488","#9333ea"];

const todayStr = "2026-05-28";

function calcSalary(emp, appts) {
  const empAppts = appts.filter(a => a.employeeId === emp.id && a.status !== 'cancelled');
  const revenue = empAppts.length * 180;
  if (emp.payType === 'hourly') return emp.hoursWorked * emp.hourlyRate;
  if (emp.payType === 'salary') return emp.salaryBase;
  return emp.salaryBase + (revenue * emp.commissionPct / 100);
}

function calcHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

const statusColors = {
  confirmed: { bg: "#d1fae5", text: "#065f46", dot: "#10b981", label: "מאושר" },
  pending:   { bg: "#fef3c7", text: "#92400e", dot: "#f59e0b", label: "ממתין" },
  cancelled: { bg: "#fee2e2", text: "#991b1b", dot: "#ef4444", label: "בוטל" },
};

const base = {
  fontFamily: "'Heebo', sans-serif",
  direction: "rtl",
};

export default function App() {
  const [page, setPage] = useState("employees");
  const [appointments, setAppointments] = useState([]);
const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [employees, setEmployees] = useState([]);
const [loadingEmployees, setLoadingEmployees] = useState(true);

  const [empView, setEmpView] = useState("list");
  const [detailId, setDetailId] = useState(null);
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [showAddShift, setShowAddShift] = useState(null);
  const [toast, setToast] = useState(null);

  const [newEmp, setNewEmp] = useState({ name: "", role: "", phone: "", payType: "hourly", hourlyRate: 45, salaryBase: 0, commissionPct: 0, workDays: ["א","ב","ג","ד","ה"], workStart: "09:00", workEnd: "18:00" });
  const [newShift, setNewShift] = useState({ date: todayStr, start: "09:00", end: "17:00" });
  const [newAppt, setNewAppt] = useState({ clientName: "", phone: "", service: services[0], date: todayStr, time: "09:00", duration: 60, notes: "", callScheduled: false, employeeId: 1 });
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [expandedAppt, setExpandedAppt] = useState(null);
  const [reminders, setReminders] = useState({ sms24h: true, sms2h: true, callAuto: true, waSent: true });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const addEmployee = async () => {
  if (!newEmp.name || !newEmp.role) return;

  const { data, error } = await supabase
    .from("employees")
    .insert({
      business_id: "eec5bb09-33e3-44e6-a4e7-1447dad5a5c7",
      name: newEmp.name,
      role: newEmp.role,
      phone: newEmp.phone || "",
      pay_type: newEmp.payType,
      hourly_rate: newEmp.hourlyRate || 45,
      salary_base: newEmp.salaryBase || 0,
      commission_pct: newEmp.commissionPct || 0,
      work_days: newEmp.workDays,
      work_start: newEmp.workStart,
      work_end: newEmp.workEnd,
      hours_worked: 0,
      status: "active"
    })

  if (error) {
    console.error("EMPLOYEE INSERT ERROR:", error);
    showToast("❌ שגיאה בהוספת עובד");
    return;
  }

  const color = COLORS[employees.length % COLORS.length];

  setEmployees(p => [
    ...p,
    {
      id: data.id,
      name: data.name,
      role: data.role,
      phone: data.phone || "",
      avatar: (data.name || "ע")[0],
      color,
      payType: data.pay_type || "hourly",
      hourlyRate: data.hourly_rate || 45,
      salaryBase: data.salary_base || 0,
      commissionPct: data.commission_pct || 0,
      workDays: data.work_days || ["א","ב","ג","ד","ה"],
      workStart: data.work_start || "09:00",
      workEnd: data.work_end || "18:00",
      hoursWorked: 0,
      status: "active",
      shifts: [],
    }
  ]);

  setShowAddEmp(false);

  setNewEmp({
    name: "",
    role: "",
    phone: "",
    payType: "hourly",
    hourlyRate: 45,
    salaryBase: 0,
    commissionPct: 0,
    workDays: ["א","ב","ג","ד","ה"],
    workStart: "09:00",
    workEnd: "18:00"
  });

  showToast("✅ עובד נשמר!");
};

  const addShift = (empId) => {
    const hrs = calcHours(newShift.start, newShift.end);
    setEmployees(p => p.map(e => e.id === empId
      ? { ...e, shifts: [...e.shifts, { ...newShift, id: Date.now(), hours: hrs }], hoursWorked: +(e.hoursWorked + hrs).toFixed(1) }
      : e
    ));
    setShowAddShift(null);
    showToast(`✅ משמרת של ${hrs} שעות נוספה!`);
  };

  const addAppt = async () => {
  if (!newAppt.clientName || !newAppt.phone) return;

  const { data, error } = await supabase
    .from("appointments")
    .insert({
 business_id: "eec5bb09-33e3-44e6-a4e7-1447dad5a5c7",
  client_name: newAppt.clientName,
  client_phone: newAppt.phone,
  service: newAppt.service,
  date: newAppt.date,
  time: newAppt.time,
  status: "pending"
})
    .select()
    .single();

  if (error) {
    console.error(error);
    showToast("❌ שגיאה בשמירת התור");
    return;
  }

  setAppointments(p => [...p, {
    id: data.id,
    clientName: data.client_name,
    phone: data.client_phone,
    service: data.service,
    date: data.date,
    time: data.time,
    duration: data.duration || 60,
    status: data.status || "pending",
    notes: data.notes || "",
    callScheduled: false,
    employeeId: data.employee_id || 1,
  }]);

  setShowAddAppt(false);
  showToast("✅ התור נשמר!");
};

  const toggleDay = (day) => setNewEmp(p => ({ ...p, workDays: p.workDays.includes(day) ? p.workDays.filter(d => d !== day) : [...p.workDays, day] }));
  const toggleStatus = (id) => { setEmployees(p => p.map(e => e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e)); showToast("עודכן!"); };
useEffect(() => {
  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        return;
      }

      const mappedAppointments = (data || []).map(a => ({
        id: a.id,
        clientName: a.client_name || "ללא שם",
        phone: a.client_phone || "",
        service: a.service_name || "שירות",
        date: a.date,
        time: a.time,
        duration: a.duration || 60,
        status: a.status || "pending",
        notes: a.notes || "",
        callScheduled: false,
        employeeId: a.employee_id || 1,
      }));

      setAppointments(mappedAppointments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAppointments(false);
    }
  };

  loadAppointments();
}, []);
useEffect(() => {
  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("EMPLOYEES LOAD ERROR:", error);
      return;
    }

    setEmployees((data || []).map((e, index) => ({
      id: e.id,
      name: e.name || "ללא שם",
      role: e.role || "עובד",
      phone: e.phone || "",
      avatar: (e.name || "ע")[0],
      color: COLORS[index % COLORS.length],
      payType: e.pay_type || "hourly",
      hourlyRate: e.hourly_rate || 45,
      salaryBase: e.salary_base || 0,
      commissionPct: e.commission_pct || 0,
      workDays: e.work_days || ["א","ב","ג","ד","ה"],
      workStart: e.work_start || "09:00",
      workEnd: e.work_end || "18:00",
      hoursWorked: 0,
      status: e.status || "active",
      shifts: [],
    })));
  };

  loadEmployees();
}, []);
  const todayAppts = appointments.filter(a => a.date === todayStr);
  const totalSalary = employees.reduce((s, e) => s + calcSalary(e, appointments), 0);
  const detailEmp = employees.find(e => e.id === detailId);

  const navItems = [
    { id: "home", icon: "🏠", label: "בית" },
    { id: "calendar", icon: "📅", label: "יומן" },
    { id: "employees", icon: "👷", label: "עובדים" },
    { id: "reminders", icon: "🔔", label: "תזכורות" },
    { id: "profile", icon: "🏪", label: "פרופיל" },
  ];

  const S = {
    app: { ...base, background: "#f4f3ff", minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 80 },
    topbar: (c1="#1e1b4b", c2="#4c1d95") => ({ background: `linear-gradient(135deg,${c1},${c2})`, padding: "52px 20px 20px", color: "white" }),
    topRow: { display: "flex", alignItems: "center", justifyContent: "space-between" },
    title: { fontSize: 20, fontWeight: 900 },
    sub: { fontSize: 12, opacity: 0.7, marginTop: 2 },
    circBtn: { width: 38, height: 38, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, color: "white" },
    content: { padding: "16px 16px 0" },
    card: { background: "white", borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid #ede9fe" },
    sTitle: { fontSize: 15, fontWeight: 800, color: "#1e1b4b", marginBottom: 12 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    statCard: { background: "white", borderRadius: 14, padding: 14, border: "1px solid #ede9fe" },
    statVal: (c="#1e1b4b") => ({ fontSize: 24, fontWeight: 900, color: c }),
    statLbl: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
    statSub: (c="#7c3aed") => ({ fontSize: 11, fontWeight: 600, color: c, marginTop: 3 }),
    empCard: { background: "white", borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid #ede9fe", cursor: "pointer" },
    avatar: (color, size=44) => ({ width: size, height: size, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: size * 0.38, flexShrink: 0 }),
    badge: (bg, color) => ({ background: bg, color, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, whiteSpace: "nowrap" }),
    chip: (active, color) => ({ width: 32, height: 32, borderRadius: "50%", background: active ? color : "#f3f4f6", color: active ? "white" : "#9ca3af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, cursor: "pointer" }),
    btnPrimary: { background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", border: "none", borderRadius: 12, padding: "13px 20px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo',sans-serif", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
    btnGreen: { background: "linear-gradient(135deg,#059669,#047857)", color: "white", border: "none", borderRadius: 12, padding: "11px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo',sans-serif", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 },
    btnOutline: { background: "white", color: "#7c3aed", border: "1.5px solid #ede9fe", borderRadius: 10, padding: "8px 12px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo',sans-serif" },
    btnSm: (bg, color) => ({ background: bg, color, border: "none", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo',sans-serif", whiteSpace: "nowrap" }),
    input: { width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb", borderRadius: 12, fontSize: 14, fontFamily: "'Heebo',sans-serif", color: "#1e1b4b", outline: "none", background: "#fafafa", direction: "rtl", boxSizing: "border-box" },
    label: { fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 5, display: "block" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "flex-end", backdropFilter: "blur(3px)" },
    sheet: { background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 430, margin: "0 auto", padding: "20px 20px 40px", maxHeight: "92vh", overflowY: "auto" },
    handle: { width: 36, height: 4, borderRadius: 2, background: "#e5e7eb", margin: "0 auto 18px" },
    shTitle: { fontSize: 18, fontWeight: 900, color: "#1e1b4b", marginBottom: 18, textAlign: "center" },
    toggle: (on) => ({ width: 46, height: 26, borderRadius: 13, background: on ? "#7c3aed" : "#e5e7eb", display: "flex", alignItems: "center", padding: "0 3px", justifyContent: on ? "flex-end" : "flex-start", cursor: "pointer", transition: "all 0.2s", flexShrink: 0 }),
    dot: { width: 20, height: 20, borderRadius: "50%", background: "white" },
    bottomNav: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "white", borderTop: "1px solid #e5e7eb", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom,8px)" },
    navBtn: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 2px 8px", cursor: "pointer", border: "none", background: "transparent", gap: 2, fontFamily: "'Heebo',sans-serif" },
    fab: { position: "fixed", bottom: 88, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#7c3aed,#4f46e5)", color: "white", border: "none", borderRadius: 28, padding: "13px 28px", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "'Heebo',sans-serif", boxShadow: "0 6px 24px rgba(124,58,237,0.4)", zIndex: 90 },
    toast: { position: "fixed", top: 58, left: "50%", transform: "translateX(-50%)", background: "#1e1b4b", color: "white", padding: "11px 20px", borderRadius: 14, fontSize: 14, fontWeight: 700, zIndex: 300, whiteSpace: "nowrap", boxShadow: "0 6px 20px rgba(0,0,0,0.25)" },
    divider: { height: 1, background: "#f3f4f6", margin: "8px 0" },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
        body{background:#f4f3ff;}
        ::-webkit-scrollbar{display:none;}
        input,select,textarea{-webkit-appearance:none;}
        select{background-image:none;}
        button:active{opacity:0.85;}
      `}</style>

      <div style={S.app}>

        {/* ═══════════════ HOME ═══════════════ */}
        {page === "home" && <>
          <div style={S.topbar()}>
            <div style={S.topRow}>
              <div><div style={S.title}>📅 יומן עסקי</div><div style={S.sub}>היום {todayAppts.filter(a=>a.status!=='cancelled').length} תורים פעילים</div></div>
              <div style={{...S.avatar("#7c3aed",38),fontSize:15}}>מ</div>
            </div>
          </div>
          <div style={S.content}>
            <div style={{...S.grid2, marginTop:16, marginBottom:16}}>
              <div style={S.statCard}><div style={S.statVal()}>{ todayAppts.filter(a=>a.status==='confirmed').length}</div><div style={S.statLbl}>תורים היום</div><div style={S.statSub()}>מאושרים</div></div>
              <div style={S.statCard}><div style={S.statVal("#059669")}>₪{todayAppts.filter(a=>a.status!=='cancelled').length*180}</div><div style={S.statLbl}>הכנסה משוערת</div><div style={S.statSub("#059669")}>₪180/תור</div></div>
              <div style={S.statCard}><div style={S.statVal()}>{ employees.filter(e=>e.status==='active').length}</div><div style={S.statLbl}>עובדים פעילים</div><div style={S.statSub()}>מתוך {employees.length}</div></div>
              <div style={S.statCard}><div style={S.statVal("#dc2626")}>₪{totalSalary.toLocaleString()}</div><div style={S.statLbl}>שכר חודשי</div><div style={S.statSub("#9ca3af")}>כל העובדים</div></div>
            </div>

            <div style={S.sTitle}>📋 תורים להיום</div>
            {todayAppts.length === 0
              ? <div style={{textAlign:"center",padding:"28px 0",color:"#9ca3af"}}><div style={{fontSize:32}}>🎉</div><div style={{fontWeight:700,marginTop:8}}>אין תורים היום</div></div>
              : todayAppts.map(a => {
                const emp = employees.find(e=>e.id===a.employeeId);
                return <div key={a.id} style={{background:"white",borderRadius:14,padding:"12px 14px",marginBottom:10,border:"1px solid #ede9fe",borderRight:`4px solid ${statusColors[a.status].dot}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12}} onClick={()=>setExpandedAppt(expandedAppt===a.id?null:a.id)}>
                  <div style={{textAlign:"center",minWidth:44}}>
                    <div style={{fontSize:15,fontWeight:900,color:"#1e1b4b"}}>{a.time}</div>
                    <div style={{fontSize:10,color:"#9ca3af"}}>{a.duration}′</div>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1e1b4b"}}>{a.clientName}</div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{a.service}</div>
                    {emp && <div style={{fontSize:11,color:emp.color,fontWeight:600,marginTop:1}}>👷 {emp.name}</div>}
                  </div>
                  <div style={S.badge(statusColors[a.status].bg, statusColors[a.status].text)}>{statusColors[a.status].label}</div>
                </div>;
              })
            }

            <div style={{...S.sTitle, marginTop:6}}>👷 עובדים היום</div>
            {employees.filter(e=>e.status==='active').map(e => {
              const count = appointments.filter(a=>a.employeeId===e.id&&a.date===todayStr&&a.status!=='cancelled').length;
              return <div key={e.id} style={{...S.card,display:"flex",alignItems:"center",gap:12,padding:"12px 14px"}}>
                <div style={S.avatar(e.color,38)}>{e.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#1e1b4b"}}>{e.name}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{e.workStart}–{e.workEnd}</div>
                </div>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:16,fontWeight:900,color:"#7c3aed"}}>{count}</div>
                  <div style={{fontSize:10,color:"#9ca3af"}}>תורים</div>
                </div>
              </div>;
            })}
          </div>
          <button style={S.fab} onClick={()=>setShowAddAppt(true)}>＋ תור חדש</button>
        </>}

        {/* ═══════════════ CALENDAR ═══════════════ */}
        {page === "calendar" && <>
          <div style={S.topbar()}>
            <div style={S.topRow}>
              <div><div style={S.title}>📅 יומן — היום</div><div style={S.sub}>{todayAppts.length} תורים</div></div>
              <button style={S.circBtn} onClick={()=>setShowAddAppt(true)}>＋</button>
            </div>
          </div>
          <div style={S.content}>
            <div style={{marginTop:16}}>
              {todayAppts.length === 0
                ? <div style={{textAlign:"center",padding:"40px 0",color:"#9ca3af"}}><div style={{fontSize:40}}>📭</div><div style={{fontWeight:700,marginTop:8}}>אין תורים היום</div></div>
                : todayAppts.map(a => {
                  const emp = employees.find(e=>e.id===a.employeeId);
                  return <div key={a.id}>
                    <div style={{background:"white",borderRadius:14,padding:"13px 14px",marginBottom:10,display:"flex",alignItems:"center",gap:12,border:"1px solid #ede9fe",borderRight:`4px solid ${statusColors[a.status].dot}`,cursor:"pointer"}} onClick={()=>setExpandedAppt(expandedAppt===a.id?null:a.id)}>
                      <div style={{textAlign:"center",minWidth:44}}>
                        <div style={{fontSize:15,fontWeight:900,color:"#1e1b4b"}}>{a.time}</div>
                        <div style={{fontSize:10,color:"#9ca3af"}}>{a.duration}′</div>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#1e1b4b"}}>{a.clientName}</div>
                        <div style={{fontSize:12,color:"#6b7280"}}>{a.service}</div>
                        {emp && <div style={{fontSize:11,color:emp.color,fontWeight:600,marginTop:1}}>👷 {emp.name}</div>}
                        {a.callScheduled && <div style={{fontSize:11,color:"#059669",marginTop:1}}>📞 שיחה מתוזמנת</div>}
                      </div>
                      <div style={S.badge(statusColors[a.status].bg,statusColors[a.status].text)}>{statusColors[a.status].label}</div>
                    </div>
                    {expandedAppt===a.id && <div style={{background:"#faf5ff",borderRadius:12,padding:"12px 14px",marginTop:-6,marginBottom:10,border:"1px solid #ede9fe"}}>
                      <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>📞 {a.phone}</div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                        <button style={S.btnSm("linear-gradient(135deg,#10b981,#059669)","white")} onClick={()=>{showToast(`📞 מחייג...`);setTimeout(()=>window.open(`tel:${a.phone}`,'_self'),500);}}>📞 חייג</button>
                        {a.status!=='confirmed' && <button style={S.btnSm("#d1fae5","#065f46")} onClick={()=>{setAppointments(p=>p.map(x=>x.id===a.id?{...x,status:'confirmed'}:x));showToast("✅ אושר!");}}>✓ אשר</button>}
                        {a.status!=='cancelled' && <button style={S.btnSm("#fee2e2","#dc2626")} onClick={()=>{setAppointments(p=>p.map(x=>x.id===a.id?{...x,status:'cancelled'}:x));showToast("❌ בוטל!");}}>✗ בטל</button>}
                      </div>
                    </div>}
                  </div>;
                })
              }
            </div>
          </div>
          <button style={S.fab} onClick={()=>setShowAddAppt(true)}>＋ תור חדש</button>
        </>}

        {/* ═══════════════ EMPLOYEES LIST ═══════════════ */}
        {page === "employees" && !detailId && <>
          <div style={S.topbar("#1e1b4b","#312e81")}>
            <div style={S.topRow}>
              <div>
                <div style={S.title}>👷 עובדים</div>
                <div style={S.sub}>{employees.length} עובדים · שכר ₪{totalSalary.toLocaleString()}/חודש</div>
              </div>
              <button style={S.circBtn} onClick={()=>setShowAddEmp(true)}>＋</button>
            </div>
          </div>
          <div style={S.content}>
            {/* tabs */}
            <div style={{display:"flex",gap:4,background:"#f3f4f6",padding:4,borderRadius:12,marginTop:16,marginBottom:16}}>
              {[{id:"list",label:"👷 עובדים"},{id:"salary",label:"💰 חישוב שכר"},{id:"schedule",label:"📆 לוח עבודה"}].map(t=>(
                <button key={t.id} style={{flex:1,padding:"8px 4px",borderRadius:9,border:"none",background:empView===t.id?"white":"transparent",color:empView===t.id?"#7c3aed":"#6b7280",fontWeight:empView===t.id?800:600,fontSize:12,cursor:"pointer",fontFamily:"'Heebo',sans-serif",boxShadow:empView===t.id?"0 2px 8px rgba(0,0,0,0.08)":"none"}} onClick={()=>setEmpView(t.id)}>{t.label}</button>
              ))}
            </div>

            {/* LIST TAB */}
            {empView === "list" && employees.map(emp => {
              const empAppts = appointments.filter(a=>a.employeeId===emp.id&&a.status!=='cancelled');
              const salary = calcSalary(emp, appointments);
              return <div key={emp.id} style={S.empCard} onClick={()=>setDetailId(emp.id)}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{position:"relative"}}>
                    <div style={S.avatar(emp.color)}>{emp.avatar}</div>
                    <div style={{position:"absolute",bottom:0,left:0,width:12,height:12,borderRadius:"50%",background:emp.status==='active'?"#10b981":"#d1d5db",border:"2px solid white"}}/>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:800,color:"#1e1b4b"}}>{emp.name}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{emp.role}</div>
                    <div style={{fontSize:11,color:emp.color,fontWeight:600,marginTop:2}}>{payTypeLabel[emp.payType]}</div>
                  </div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:17,fontWeight:900,color:"#059669"}}>₪{salary.toLocaleString()}</div>
                    <div style={{fontSize:10,color:"#9ca3af"}}>שכר חודשי</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                  {[{v:emp.hoursWorked,l:"שעות"},{v:empAppts.length,l:"תורים"},{v:emp.workStart,l:"כניסה"},{v:emp.workEnd,l:"יציאה"}].map((s,i)=>(
                    <div key={i} style={{background:"#f9f7ff",borderRadius:8,padding:"6px",textAlign:"center"}}>
                      <div style={{fontSize:12,fontWeight:800,color:"#7c3aed"}}>{s.v}</div>
                      <div style={{fontSize:9,color:"#9ca3af",marginTop:1}}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:6}}>
                  {allDays.map(d=>(
                    <div key={d} style={S.chip(emp.workDays.includes(d),emp.color)}>{d}</div>
                  ))}
                </div>
              </div>;
            })}

            {/* SALARY TAB */}
            {empView === "salary" && <>
              <div style={{background:"linear-gradient(135deg,#1e1b4b,#4c1d95)",borderRadius:16,padding:20,marginBottom:16,color:"white"}}>
                <div style={{fontSize:12,opacity:0.7}}>סה"כ שכר לתשלום — מאי 2026</div>
                <div style={{fontSize:32,fontWeight:900,margin:"4px 0"}}>₪{totalSalary.toLocaleString()}</div>
                <div style={{fontSize:12,opacity:0.7}}>{employees.length} עובדים פעילים</div>
              </div>
              {employees.map(emp => {
                const salary = calcSalary(emp, appointments);
                const empAppts = appointments.filter(a=>a.employeeId===emp.id&&a.status!=='cancelled');
                const revenue = empAppts.length * 180;
                return <div key={emp.id} style={S.card}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={S.avatar(emp.color,38)}>{emp.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#1e1b4b"}}>{emp.name}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{emp.role} · {payTypeLabel[emp.payType]}</div>
                    </div>
                    <div style={{fontSize:18,fontWeight:900,color:"#059669"}}>₪{salary.toLocaleString()}</div>
                  </div>
                  <div style={{background:"#f9f7ff",borderRadius:10,padding:"10px 12px"}}>
                    {emp.payType==='hourly' && <>
                      <SalaryRow l="שעות עבודה" v={`${emp.hoursWorked} שעות`} />
                      <SalaryRow l="תעריף שעתי" v={`₪${emp.hourlyRate}/שעה`} />
                      <SalaryRow l={`סה"כ לתשלום`} v={`₪${salary.toLocaleString()}`} bold />
                    </>}
                    {emp.payType==='salary' && <>
                      <SalaryRow l="משכורת קבועה" v={`₪${emp.salaryBase.toLocaleString()}`} />
                      <SalaryRow l="שעות עבודה בפועל" v={`${emp.hoursWorked} שעות`} />
                      <SalaryRow l={`סה"כ לתשלום`} v={`₪${salary.toLocaleString()}`} bold />
                    </>}
                    {emp.payType==='commission' && <>
                      <SalaryRow l="בסיס חודשי" v={`₪${emp.salaryBase.toLocaleString()}`} />
                      <SalaryRow l="הכנסות (תורים)" v={`₪${revenue.toLocaleString()}`} />
                      <SalaryRow l={`עמלה ${emp.commissionPct}%`} v={`₪${(revenue*emp.commissionPct/100).toLocaleString()}`} />
                      <SalaryRow l={`סה"כ לתשלום`} v={`₪${salary.toLocaleString()}`} bold />
                    </>}
                  </div>
                  <button style={{...S.btnGreen,marginTop:10}} onClick={()=>showToast(`📲 תלוש שכר נשלח ל${emp.name}`)}>
                    📲 שלח תלוש שכר
                  </button>
                </div>;
              })}
            </>}

            {/* SCHEDULE TAB */}
            {empView === "schedule" && <>
              <div style={S.sTitle}>לוח עבודה — השבוע</div>
              {employees.filter(e=>e.status==='active').map(emp => (
                <div key={emp.id} style={S.card}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={S.avatar(emp.color,36)}>{emp.avatar}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#1e1b4b"}}>{emp.name}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{emp.workStart}–{emp.workEnd}</div>
                    </div>
                    <div style={{display:"flex",gap:4}}>
                      {allDays.map(d=>(
                        <div key={d} style={S.chip(emp.workDays.includes(d),emp.color)}>{d}</div>
                      ))}
                    </div>
                  </div>
                  {emp.shifts.length > 0 && (
                    <div style={{background:"#f9f7ff",borderRadius:10,padding:"8px 10px"}}>
                      {emp.shifts.slice(-3).map((sh,i)=>(
                        <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<2?"1px solid #f0eeff":"none"}}>
                          <div style={{fontSize:12,color:"#6b7280"}}>{sh.date}</div>
                          <div style={{fontSize:12,color:"#1e1b4b",fontWeight:600}}>{sh.start}–{sh.end}</div>
                          <div style={{fontSize:12,color:"#7c3aed",fontWeight:800}}>{sh.hours}ש׳</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>}
          </div>
          <button style={S.fab} onClick={()=>setShowAddEmp(true)}>＋ עובד חדש</button>
        </>}

        {/* ═══════════════ EMPLOYEE DETAIL ═══════════════ */}
        {page === "employees" && detailId && detailEmp && <>
          <div style={S.topbar(detailEmp.color, detailEmp.color + "cc")}>
            <div style={S.topRow}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button style={S.circBtn} onClick={()=>setDetailId(null)}>←</button>
                <div>
                  <div style={S.title}>{detailEmp.name}</div>
                  <div style={S.sub}>{detailEmp.role} · {payTypeLabel[detailEmp.payType]}</div>
                </div>
              </div>
              <div style={S.avatar("rgba(255,255,255,0.25)",40)}>{detailEmp.avatar}</div>
            </div>
          </div>
          <div style={S.content}>
            {/* salary hero */}
            <div style={{background:"white",borderRadius:16,padding:18,marginTop:16,marginBottom:12,border:"1px solid #ede9fe",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,color:"#9ca3af"}}>שכר חודשי משוער</div>
                <div style={{fontSize:30,fontWeight:900,color:"#059669",margin:"4px 0"}}>₪{calcSalary(detailEmp,appointments).toLocaleString()}</div>
                <div style={{fontSize:12,color:"#6b7280"}}>{detailEmp.hoursWorked} שעות · {appointments.filter(a=>a.employeeId===detailEmp.id&&a.status!=='cancelled').length} תורים</div>
              </div>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:28,fontWeight:900,color:"#7c3aed"}}>{detailEmp.hoursWorked}</div>
                <div style={{fontSize:11,color:"#9ca3af"}}>שעות החודש</div>
              </div>
            </div>

            {/* work days */}
            <div style={S.card}>
              <div style={S.sTitle}>📅 ימי עבודה ושעות</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                {allDays.map(d=>(
                  <div key={d} style={S.chip(detailEmp.workDays.includes(d),detailEmp.color)}>{d}</div>
                ))}
              </div>
              <div style={{fontSize:13,color:"#6b7280"}}>🕐 {detailEmp.workStart} עד {detailEmp.workEnd}</div>
            </div>

            {/* shifts */}
            <div style={S.card}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <div style={S.sTitle}>🕐 משמרות</div>
                <button style={{...S.btnOutline,padding:"7px 12px",fontSize:12}} onClick={()=>setShowAddShift(detailEmp.id)}>＋ משמרת</button>
              </div>
              {detailEmp.shifts.length === 0
                ? <div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:"16px 0"}}>אין משמרות רשומות</div>
                : [...detailEmp.shifts].reverse().map((sh,i)=>(
                  <div key={i} style={{...S.row,borderBottom:i<detailEmp.shifts.length-1?"1px solid #f3f4f6":"none"}}>
                    <div style={{fontSize:13,fontWeight:600,color:"#1e1b4b"}}>{sh.date}</div>
                    <div style={{fontSize:13,color:"#6b7280"}}>{sh.start}–{sh.end}</div>
                    <div style={{...S.badge("#ede9fe","#7c3aed")}}>{sh.hours} שעות</div>
                  </div>
                ))
              }
              <div style={{background:"#f9f7ff",borderRadius:10,padding:"10px 12px",marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>סה"כ שעות החודש</div>
                <div style={{fontSize:16,fontWeight:900,color:"#7c3aed"}}>{detailEmp.hoursWorked} שעות</div>
              </div>
            </div>

            {/* appointments */}
            <div style={S.card}>
              <div style={S.sTitle}>📋 תורים של {detailEmp.name}</div>
              {appointments.filter(a=>a.employeeId===detailEmp.id).length === 0
                ? <div style={{textAlign:"center",color:"#9ca3af",fontSize:13,padding:"16px 0"}}>אין תורים</div>
                : appointments.filter(a=>a.employeeId===detailEmp.id).slice(0,6).map((a,i,arr)=>(
                  <div key={a.id} style={{...S.row,borderBottom:i<arr.length-1?"1px solid #f3f4f6":"none"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>{a.clientName}</div>
                      <div style={{fontSize:11,color:"#9ca3af"}}>{a.date} {a.time}</div>
                    </div>
                    <div style={{fontSize:12,color:"#6b7280"}}>{a.service}</div>
                    <div style={S.badge(statusColors[a.status].bg,statusColors[a.status].text)}>{statusColors[a.status].label}</div>
                  </div>
                ))
              }
            </div>

            {/* salary breakdown */}
            <div style={S.card}>
              <div style={S.sTitle}>💰 פירוט שכר</div>
              <div style={{background:"#f9f7ff",borderRadius:10,padding:"12px"}}>
                {detailEmp.payType==='hourly' && <>
                  <SalaryRow l="שעות עבודה" v={`${detailEmp.hoursWorked} שעות`} />
                  <SalaryRow l="תעריף שעתי" v={`₪${detailEmp.hourlyRate}`} />
                  <SalaryRow l={`סה"כ לתשלום`} v={`₪${calcSalary(detailEmp,appointments).toLocaleString()}`} bold />
                </>}
                {detailEmp.payType==='salary' && <>
                  <SalaryRow l="משכורת קבועה" v={`₪${detailEmp.salaryBase.toLocaleString()}`} />
                  <SalaryRow l={`סה"כ לתשלום`} v={`₪${calcSalary(detailEmp,appointments).toLocaleString()}`} bold />
                </>}
                {detailEmp.payType==='commission' && <>
                  <SalaryRow l="בסיס חודשי" v={`₪${detailEmp.salaryBase.toLocaleString()}`} />
                  <SalaryRow l="הכנסות שהביא" v={`₪${(appointments.filter(a=>a.employeeId===detailEmp.id&&a.status!=='cancelled').length*180).toLocaleString()}`} />
                  <SalaryRow l={`עמלה (${detailEmp.commissionPct}%)`} v={`₪${(appointments.filter(a=>a.employeeId===detailEmp.id&&a.status!=='cancelled').length*180*detailEmp.commissionPct/100).toLocaleString()}`} />
                  <SalaryRow l={`סה"כ לתשלום`} v={`₪${calcSalary(detailEmp,appointments).toLocaleString()}`} bold />
                </>}
              </div>
              <button style={{...S.btnGreen,marginTop:12}} onClick={()=>showToast(`📲 תלוש שכר נשלח ל${detailEmp.name}`)}>📲 שלח תלוש שכר</button>
            </div>

            <button style={{...S.btnPrimary,background:detailEmp.status==='active'?"#fee2e2":"#d1fae5",color:detailEmp.status==='active'?"#dc2626":"#059669",marginBottom:24,border:"none"}} onClick={()=>toggleStatus(detailEmp.id)}>
              {detailEmp.status==='active'?'⏸ השהה עובד':'▶ הפעל מחדש'}
            </button>
          </div>
        </>}

        {/* ═══════════════ REMINDERS ═══════════════ */}
        {page === "reminders" && <>
          <div style={S.topbar()}><div style={S.title}>🔔 תזכורות ושיחות</div><div style={{...S.sub,marginTop:4}}>ניהול אוטומציות</div></div>
          <div style={S.content}>
            <div style={{marginTop:16}}>
              {[
                {title:"📱 SMS אוטומטי", items:[{k:"sms24h",l:"24 שעות לפני תור",s:"SMS עם פרטי התור"},{k:"sms2h",l:"2 שעות לפני",s:"תזכורת + כפתור ביטול"}]},
                {title:"💬 וואטסאפ", items:[{k:"waSent",l:"אישור קביעה",s:"נשלח מיד"},{k:"waNav",l:"שעה לפני + ניווט",s:"Waze / Google Maps"}]},
                {title:"📞 שיחות GSM", items:[{k:"callAuto",l:"חיוג 30 דקות לפני",s:"מחייג אוטומטי מהטלפון"}]},
              ].map(sec=>(
                <div key={sec.title} style={{...S.card,marginBottom:12}}>
                  <div style={S.sTitle}>{sec.title}</div>
                  {sec.items.map((r,i)=>(
                    <div key={r.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:i<sec.items.length-1?"1px solid #f3f4f6":"none"}}>
                      <div><div style={{fontSize:14,fontWeight:700,color:"#1e1b4b"}}>{r.l}</div><div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{r.s}</div></div>
                      <div style={S.toggle(reminders[r.k])} onClick={()=>setReminders(p=>({...p,[r.k]:!p[r.k]}))}><div style={S.dot}/></div>
                    </div>
                  ))}
                </div>
              ))}
              <div style={S.card}>
                <div style={S.sTitle}>🔗 Twilio — שיחות מהשרת</div>
                <input style={{...S.input,marginBottom:10}} placeholder="Account SID" dir="ltr" />
                <input style={{...S.input,marginBottom:14}} type="password" placeholder="Auth Token" dir="ltr" />
                <button style={{...S.btnPrimary,background:"linear-gradient(135deg,#10b981,#059669)"}} onClick={()=>showToast("🔗 Twilio חובר!")}>חבר Twilio</button>
              </div>
            </div>
          </div>
        </>}

        {/* ═══════════════ PROFILE ═══════════════ */}
        {page === "profile" && <>
          <div style={S.topbar()}><div style={S.title}>🏪 פרופיל העסק</div></div>
          <div style={S.content}>
            <div style={{width:"100%",height:130,borderRadius:16,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:52,marginTop:16,marginBottom:12,cursor:"pointer"}} onClick={()=>showToast("📷 חבר Cloudinary")}>✂️</div>
            <div style={S.card}>
              <div style={S.sTitle}>📝 פרטי העסק</div>
              {["שם העסק","סוג עסק","כתובת","טלפון","אינסטגרם"].map((f,i)=>(
                <div key={i} style={{marginBottom:12}}><label style={S.label}>{f}</label><input style={S.input} placeholder={f} /></div>
              ))}
              <div style={{marginBottom:12}}><label style={S.label}>תיאור</label><textarea style={{...S.input,resize:"vertical",height:70}} /></div>
              <button style={S.btnPrimary} onClick={()=>showToast("✅ נשמר!")}>שמור שינויים</button>
            </div>
          </div>
        </>}

        {/* ═══════════════ BOTTOM NAV ═══════════════ */}
        <div style={S.bottomNav}>
          {navItems.map(n=>(
            <button key={n.id} style={S.navBtn} onClick={()=>{setPage(n.id);setDetailId(null);}}>
              <span style={{fontSize:20,opacity:page===n.id?1:0.45}}>{n.icon}</span>
              <span style={{fontSize:9,fontWeight:page===n.id?800:600,color:page===n.id?"#7c3aed":"#9ca3af"}}>{n.label}</span>
              {page===n.id && <div style={{width:4,height:4,borderRadius:"50%",background:"#7c3aed"}}/>}
            </button>
          ))}
        </div>

        {/* ═══════════════ ADD APPOINTMENT SHEET ═══════════════ */}
        {showAddAppt && <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setShowAddAppt(false)}>
          <div style={S.sheet}>
            <div style={S.handle}/><div style={S.shTitle}>📅 תור חדש</div>
            <div style={{marginBottom:12}}><label style={S.label}>שם לקוח *</label><input style={S.input} placeholder="שם מלא" value={newAppt.clientName} onChange={e=>setNewAppt(p=>({...p,clientName:e.target.value}))} /></div>
            <div style={{marginBottom:12}}><label style={S.label}>טלפון *</label><input style={{...S.input,direction:"ltr"}} placeholder="050-0000000" value={newAppt.phone} onChange={e=>setNewAppt(p=>({...p,phone:e.target.value}))} /></div>
            <div style={{marginBottom:12}}><label style={S.label}>שירות</label><select style={S.input} value={newAppt.service} onChange={e=>setNewAppt(p=>({...p,service:e.target.value}))}>{services.map(s=><option key={s}>{s}</option>)}</select></div>
            <div style={{marginBottom:12}}><label style={S.label}>עובד מבצע</label><select style={S.input} value={newAppt.employeeId} onChange={e=>setNewAppt(p=>({...p,employeeId:Number(e.target.value)}))}>
              {employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
            </select></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div><label style={S.label}>תאריך</label><input style={S.input} type="date" value={newAppt.date} onChange={e=>setNewAppt(p=>({...p,date:e.target.value}))} /></div>
              <div><label style={S.label}>שעה</label><select style={S.input} value={newAppt.time} onChange={e=>setNewAppt(p=>({...p,time:e.target.value}))}>{shiftHours.map(h=><option key={h}>{h}</option>)}</select></div>
            </div>
            <div style={{marginBottom:14}}><label style={S.label}>הערות</label><input style={S.input} placeholder="הערות..." value={newAppt.notes} onChange={e=>setNewAppt(p=>({...p,notes:e.target.value}))} /></div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"#f0fdf4",borderRadius:12,padding:"12px 14px",marginBottom:16,border:"1px solid #bbf7d0"}}>
              <div><div style={{fontSize:14,fontWeight:700,color:"#065f46"}}>📞 תזמן שיחה אוטומטית</div><div style={{fontSize:12,color:"#6b7280",marginTop:2}}>30 דק׳ לפני</div></div>
              <div style={S.toggle(newAppt.callScheduled)} onClick={()=>setNewAppt(p=>({...p,callScheduled:!p.callScheduled}))}><div style={S.dot}/></div>
            </div>
            <button style={S.btnPrimary} onClick={addAppt}>＋ הוסף תור</button>
          </div>
        </div>}

        {/* ═══════════════ ADD EMPLOYEE SHEET ═══════════════ */}
        {showAddEmp && <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setShowAddEmp(false)}>
          <div style={S.sheet}>
            <div style={S.handle}/><div style={S.shTitle}>👷 עובד חדש</div>
            <div style={{marginBottom:12}}><label style={S.label}>שם מלא *</label><input style={S.input} placeholder="שם העובד" value={newEmp.name} onChange={e=>setNewEmp(p=>({...p,name:e.target.value}))} /></div>
            <div style={{marginBottom:12}}><label style={S.label}>תפקיד *</label><input style={S.input} placeholder="ספרית / קוסמטיקאית..." value={newEmp.role} onChange={e=>setNewEmp(p=>({...p,role:e.target.value}))} /></div>
            <div style={{marginBottom:12}}><label style={S.label}>טלפון</label><input style={{...S.input,direction:"ltr"}} placeholder="050-0000000" value={newEmp.phone} onChange={e=>setNewEmp(p=>({...p,phone:e.target.value}))} /></div>

            <div style={{marginBottom:12}}>
              <label style={S.label}>סוג תגמול</label>
              <select style={S.input} value={newEmp.payType} onChange={e=>setNewEmp(p=>({...p,payType:e.target.value}))}>
                <option value="hourly">⏱ שעתי</option>
                <option value="salary">📋 משכורת קבועה</option>
                <option value="commission">💹 בסיס + עמלה</option>
              </select>
            </div>

            {newEmp.payType==='hourly' && <div style={{marginBottom:12}}><label style={S.label}>תעריף שעתי (₪)</label><input style={{...S.input,direction:"ltr"}} type="number" value={newEmp.hourlyRate} onChange={e=>setNewEmp(p=>({...p,hourlyRate:Number(e.target.value)}))} /></div>}
            {newEmp.payType==='salary' && <div style={{marginBottom:12}}><label style={S.label}>משכורת חודשית (₪)</label><input style={{...S.input,direction:"ltr"}} type="number" value={newEmp.salaryBase} onChange={e=>setNewEmp(p=>({...p,salaryBase:Number(e.target.value)}))} /></div>}
            {newEmp.payType==='commission' && <>
              <div style={{marginBottom:12}}><label style={S.label}>בסיס חודשי (₪)</label><input style={{...S.input,direction:"ltr"}} type="number" value={newEmp.salaryBase} onChange={e=>setNewEmp(p=>({...p,salaryBase:Number(e.target.value)}))} /></div>
              <div style={{marginBottom:12}}><label style={S.label}>אחוז עמלה (%)</label><input style={{...S.input,direction:"ltr"}} type="number" value={newEmp.commissionPct} onChange={e=>setNewEmp(p=>({...p,commissionPct:Number(e.target.value)}))} /></div>
            </>}

            <div style={{marginBottom:12}}>
              <label style={S.label}>ימי עבודה</label>
              <div style={{display:"flex",gap:8,marginTop:6}}>
                {allDays.map(d=><div key={d} style={S.chip(newEmp.workDays.includes(d),"#7c3aed")} onClick={()=>toggleDay(d)}>{d}</div>)}
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              <div><label style={S.label}>שעת כניסה</label><input style={S.input} type="time" value={newEmp.workStart} onChange={e=>setNewEmp(p=>({...p,workStart:e.target.value}))} /></div>
              <div><label style={S.label}>שעת יציאה</label><input style={S.input} type="time" value={newEmp.workEnd} onChange={e=>setNewEmp(p=>({...p,workEnd:e.target.value}))} /></div>
            </div>
            <button style={S.btnPrimary} onClick={addEmployee}>＋ הוסף עובד</button>
          </div>
        </div>}

        {/* ═══════════════ ADD SHIFT SHEET ═══════════════ */}
        {showAddShift && <div style={S.overlay} onClick={e=>e.target===e.currentTarget&&setShowAddShift(null)}>
          <div style={S.sheet}>
            <div style={S.handle}/><div style={S.shTitle}>🕐 הוסף משמרת</div>
            <div style={{marginBottom:12}}><label style={S.label}>תאריך</label><input style={S.input} type="date" value={newShift.date} onChange={e=>setNewShift(p=>({...p,date:e.target.value}))} /></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
              <div><label style={S.label}>שעת כניסה</label><select style={S.input} value={newShift.start} onChange={e=>setNewShift(p=>({...p,start:e.target.value}))}>{shiftHours.map(h=><option key={h}>{h}</option>)}</select></div>
              <div><label style={S.label}>שעת יציאה</label><select style={S.input} value={newShift.end} onChange={e=>setNewShift(p=>({...p,end:e.target.value}))}>{shiftHours.map(h=><option key={h}>{h}</option>)}</select></div>
            </div>
            <div style={{background:"#f9f7ff",borderRadius:12,padding:"12px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>סה"כ שעות</div>
              <div style={{fontSize:18,fontWeight:900,color:"#7c3aed"}}>{calcHours(newShift.start,newShift.end)} שעות</div>
            </div>
            <button style={S.btnPrimary} onClick={()=>addShift(showAddShift)}>＋ הוסף משמרת</button>
          </div>
        </div>}

        {/* TOAST */}
        {toast && <div style={S.toast}>{toast}</div>}
      </div>
    </>
  );
}

function SalaryRow({ l, v, bold }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"5px 0",borderBottom:"1px solid #f0eeff"}}>
      <div style={{fontSize:12,color:"#6b7280"}}>{l}</div>
      <div style={{fontSize:13,fontWeight:bold?900:600,color:bold?"#059669":"#1e1b4b"}}>{v}</div>
    </div>
  );
}
