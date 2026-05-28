"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

const BUSINESS = {
  slug: "moriya-studio", name: "סטודיו יופי מוריה", tagline: "חווית יופי מפנקת ואישית",
  address: "רחוב הרצל 42, תל אביב", phone: "03-1234567", instagram: "@studio_moriya",
  rating: 4.9, reviewCount: 127, coverEmoji: "✂️", coverGradient: ["#7c3aed","#a855f7"],
  accentColor: "#7c3aed",
  about: "סטודיו יופי מקצועי המתמחה בעיצוב שיער, טיפולי פנים ועיצוב גבות. כבר 12 שנה מפנקים לקוחות.",
  hours: [{day:"ראשון–חמישי",time:"08:00–19:00"},{day:"שישי",time:"08:00–14:00"},{day:"שבת",time:"סגור"}],
  images: ["✂️","💅","🌸","✨","💆","💇"],
};

const EMPLOYEES = [
  { id:1, name:"מוריה כהן", role:"מעצבת שיער בכירה", avatar:"מ", color:"#7c3aed", rating:5.0 },
  { id:2, name:"שרה לוי", role:"קוסמטיקאית", avatar:"ש", color:"#be185d", rating:4.8 },
  { id:3, name:"רחל ברק", role:"מניקוריסטית", avatar:"ר", color:"#059669", rating:4.9 },
];

const SERVICES = [
  { id:1, name:"תספורת", duration:45, price:120, emoji:"✂️", employeeIds:[1] },
  { id:2, name:"צבע שיער", duration:90, price:280, emoji:"🎨", employeeIds:[1] },
  { id:3, name:"תספורת + צבע", duration:120, price:380, emoji:"💇", employeeIds:[1] },
  { id:4, name:"טיפול פנים", duration:60, price:200, emoji:"💆", employeeIds:[2] },
  { id:5, name:"עיצוב גבות", duration:30, price:80, emoji:"✨", employeeIds:[2] },
  { id:6, name:"מניקור", duration:45, price:100, emoji:"💅", employeeIds:[3] },
  { id:7, name:"פדיקור", duration:60, price:130, emoji:"🦶", employeeIds:[3] },
];

const REVIEWS = [
  { name:"דנה מ.", text:"מוריה מדהימה! תמיד יוצאת עם תסרוקת מושלמת 😍", rating:5, date:"לפני 3 ימים" },
  { name:"יעל כ.", text:"שירות אישי ומקצועי ברמה הכי גבוהה. ממליצה בחום!", rating:5, date:"לפני שבוע" },
  { name:"נועה ל.", text:"המקום הכי נעים. האווירה פשוט מושלמת 🌸", rating:5, date:"לפני 2 שבועות" },
];

const AVAILABLE_DATES = [
  {date:"2026-05-28",label:"היום",day:"ד׳"},{date:"2026-05-29",label:"מחר",day:"ה׳"},
  {date:"2026-05-31",label:"31/5",day:"א׳"},{date:"2026-06-01",label:"1/6",day:"ב׳"},
  {date:"2026-06-02",label:"2/6",day:"ג׳"},{date:"2026-06-03",label:"3/6",day:"ד׳"},
  {date:"2026-06-04",label:"4/6",day:"ה׳"},
];

const AVAILABLE_TIMES = {
  "2026-05-28":["10:00","11:30","13:00","15:30","17:00"],
  "2026-05-29":["08:30","09:00","11:00","14:00","16:00","18:00"],
  "2026-05-31":["08:00","09:30","10:30","12:00","13:30","15:00","17:30"],
  "2026-06-01":["09:00","10:00","11:30","14:30","16:30"],
  "2026-06-02":["08:30","10:00","12:00","15:00","17:00"],
  "2026-06-03":["09:00","11:00","13:00"],
  "2026-06-04":["08:00","10:30","13:00","15:30","18:00"],
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
  body{background:#fafafa;}
  ::-webkit-scrollbar{display:none;}
  input,select,textarea{-webkit-appearance:none;background-image:none;}
  button:active{opacity:0.82;transform:scale(0.98);}
  @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pop{0%{transform:scale(0.6)}70%{transform:scale(1.1)}100%{transform:scale(1)}}
  .fadeUp{animation:fadeUp 0.3s ease both;}
`;

const accent = BUSINESS.accentColor;

function useStyles() {
  return {
    app:      { fontFamily:"'Heebo',sans-serif", direction:"rtl", background:"#fafafa", minHeight:"100vh", maxWidth:430, margin:"0 auto" },
    cover:    { background:`linear-gradient(160deg,${BUSINESS.coverGradient[0]},${BUSINESS.coverGradient[1]})`, padding:"56px 20px 24px", color:"white", position:"relative", overflow:"hidden" },
    tabBar:   { background:"white", display:"flex", borderBottom:"2px solid #f3f4f6", position:"sticky", top:0, zIndex:50 },
    tab:      (a)=>({ flex:1, padding:"13px 4px", textAlign:"center", fontSize:13, fontWeight:a?800:600, color:a?accent:"#9ca3af", borderBottom:a?`2px solid ${accent}`:"2px solid transparent", marginBottom:-2, cursor:"pointer", background:"transparent", border:"none", fontFamily:"'Heebo',sans-serif" }),
    content:  { padding:"18px 16px 100px" },
    sTitle:   { fontSize:16, fontWeight:800, color:"#1e1b4b", marginBottom:14 },
    card:     { background:"white", borderRadius:14, padding:"14px 16px", marginBottom:10, border:"1px solid #f0f0f0", boxShadow:"0 1px 4px rgba(0,0,0,0.04)" },
    svcCard:  (s)=>({ background:"white", borderRadius:14, padding:"14px 16px", marginBottom:10, border:`2px solid ${s?accent:"#f0f0f0"}`, cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all 0.18s", boxShadow:s?`0 4px 16px ${accent}28`:"0 1px 4px rgba(0,0,0,0.04)" }),
    empCard:  (s)=>({ background:"white", borderRadius:14, padding:"13px 14px", marginBottom:10, border:`2px solid ${s?accent:"#f0f0f0"}`, cursor:"pointer", display:"flex", alignItems:"center", gap:12, transition:"all 0.18s", boxShadow:s?`0 4px 16px ${accent}28`:"0 1px 4px rgba(0,0,0,0.04)" }),
    avatar:   (c,sz=44)=>({ width:sz, height:sz, borderRadius:"50%", background:c, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:900, fontSize:sz*0.38, flexShrink:0 }),
    emojiBox: { width:44, height:44, borderRadius:12, background:"#f9f7ff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 },
    dateRow:  { display:"flex", gap:8, overflowX:"auto", paddingBottom:4, marginBottom:16 },
    dateChip: (s)=>({ flexShrink:0, textAlign:"center", padding:"10px 14px", borderRadius:12, border:`2px solid ${s?accent:"#f0f0f0"}`, background:s?accent:"white", cursor:"pointer", minWidth:58, transition:"all 0.18s" }),
    timeGrid: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 },
    timeChip: (s)=>({ padding:"11px 8px", borderRadius:10, border:`2px solid ${s?accent:"#f0f0f0"}`, background:s?accent:"white", color:s?"white":"#374151", cursor:"pointer", textAlign:"center", fontSize:14, fontWeight:700, transition:"all 0.18s" }),
    input:    { width:"100%", padding:"13px 14px", border:"1.5px solid #e5e7eb", borderRadius:12, fontSize:15, fontFamily:"'Heebo',sans-serif", color:"#1e1b4b", outline:"none", background:"#fafafa", direction:"rtl", boxSizing:"border-box" },
    label:    { fontSize:13, fontWeight:700, color:"#374151", marginBottom:5, display:"block" },
    btnPri:   (d)=>({ background:d?`#e5e7eb`:`linear-gradient(135deg,${accent},#4f46e5)`, color:d?"#9ca3af":"white", border:"none", borderRadius:14, padding:"15px 20px", fontSize:16, fontWeight:800, cursor:d?"default":"pointer", fontFamily:"'Heebo',sans-serif", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, boxShadow:d?"none":`0 6px 20px ${accent}35` }),
    btnOut:   { background:"white", color:accent, border:`2px solid ${accent}`, borderRadius:12, padding:"12px 20px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Heebo',sans-serif", width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6 },
    btnSm:    (bg,c)=>({ background:bg, color:c, border:"none", borderRadius:8, padding:"7px 13px", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Heebo',sans-serif", whiteSpace:"nowrap" }),
    sumBox:   { background:"#faf5ff", borderRadius:14, padding:"14px 16px", marginBottom:16, border:`1px solid #ede9fe` },
    sumRow:   { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0" },
    sticky:   { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, background:"white", padding:"12px 16px 24px", borderTop:"1px solid #f0f0f0", zIndex:50 },
    otpInput: { width:46, height:52, borderRadius:12, border:"2px solid #e5e7eb", textAlign:"center", fontSize:22, fontWeight:900, fontFamily:"'Heebo',sans-serif", color:"#1e1b4b", outline:"none" },
    stars:    { color:"#fbbf24", fontSize:14 },
  };
}

export default function App() {
  const S = useStyles();
  const [view, setView] = useState("booking");
  const [section, setSection] = useState("book");
  const [step, setStep] = useState("landing");

  // booking state
  const [selSvc, setSelSvc] = useState(null);
  const [selEmp, setSelEmp] = useState(null);
  const [selDate, setSelDate] = useState(null);
  const [selTime, setSelTime] = useState(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientNote, setClientNote] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myAppts, setMyAppts] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [mounted, setMounted] = useState(false);

  // login state
  const [loginPhone, setLoginPhone] = useState("");
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // cancel / review state
  const [cancelId, setCancelId] = useState(null);
  const [reviewId, setReviewId] = useState(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewedIds, setReviewedIds] = useState([]);

  // ── FIX 1: mounted effect ──
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── FIX 2: localStorage effect ──
  useEffect(() => {
    if (!mounted) return;
    const savedPhone = localStorage.getItem("clientPhone");
    const savedLoggedIn = localStorage.getItem("loggedIn");

    if (savedPhone) {
      setClientPhone(savedPhone);
      setLoginPhone(savedPhone);
    }
    if (savedLoggedIn === "true" && savedPhone) {
      setLoggedIn(true);
      setOtpVerified(true);
      loadMyAppointments(savedPhone);
    }
  }, [mounted]);

  // ── FIX 3: booked times effect ──
  useEffect(() => {
    if (!selDate) return;
    const loadBookedTimes = async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("time")
        .eq("date", selDate)
        .neq("status", "cancelled");
      if (error) { console.error("BOOKED TIMES ERROR:", error); return; }
      setBookedTimes((data || []).map(a => String(a.time).slice(0, 5)));
    };
    loadBookedTimes();
  }, [selDate]);

  if (!mounted) return null;

  const availEmp = selSvc ? EMPLOYEES.filter(e => selSvc.employeeIds.includes(e.id)) : EMPLOYEES;
  const availableTimes = selDate
    ? (AVAILABLE_TIMES[selDate] || []).filter(t => !bookedTimes.includes(t))
    : [];

  const sendBookingOtp = () => {
    if (clientPhone.length < 9) return;
    setLoading(true);
    setTimeout(() => { setOtpSent(true); setLoading(false); }, 1000);
  };

  const verifyBookingOtp = () => {
    setLoading(true);
    setTimeout(() => {
      setOtpVerified(true);
      localStorage.setItem("clientPhone", clientPhone);
      localStorage.setItem("otpVerified", "true");
      localStorage.setItem("loggedIn", "true");
      setLoading(false);
    }, 800);
  };

  const loadMyAppointments = async (phone = clientPhone) => {
    if (!phone) return;
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("client_phone", phone)
      .order("created_at", { ascending: false });
    if (error) { console.error("LOAD MY APPOINTMENTS ERROR:", error); return; }
    setMyAppts(data || []);
  };

  // ── FIX 4: confirmBooking cleaned up ──
  const confirmBooking = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .insert({
        business_id: "eec5bb09-33e3-44e6-a4e7-1447dad5a5c7",
        client_name: clientName,
        client_phone: clientPhone,
        service: selSvc.name,
        date: selDate,
        time: selTime,
        duration: selSvc.duration,
        notes: clientNote || "",
        status: "upcoming"
      })
      .select()
      .single();

    if (error) {
      console.error("BOOKING INSERT ERROR:", error);
      setLoading(false);
      alert("שגיאה בקביעת התור");
      return;
    }

    const newAppt = {
      id: data.id,
      service: selSvc.name,
      serviceEmoji: selSvc.emoji,
      employee: selEmp.name,
      date: selDate,
      time: selTime,
      duration: selSvc.duration,
      price: selSvc.price,
      status: "upcoming",
      business: BUSINESS.name,
      note: clientNote,
      client_name: clientName,
      client_phone: clientPhone,
    };

    setBookedTimes(prev => [...prev, selTime]);
    setMyAppts(prev => [...prev, newAppt]);
    setLoggedIn(true);
    setLoading(false);
    setStep("success");
  };

  const cancelAppt = (id) => {
    setMyAppts(p => p.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
    setCancelId(null);
  };

  const submitReview = () => {
    setReviewedIds(p => [...p, reviewId]);
    setReviewId(null);
    setReviewText("");
    setReviewStars(5);
  };

  const sendLoginOtp = () => {
    if (loginPhone.length < 9) return;
    setLoginLoading(true);
    setTimeout(() => { setLoginOtpSent(true); setLoginLoading(false); }, 1000);
  };

  const verifyLoginOtp = () => {
    setLoginLoading(true);
    setTimeout(() => {
      setLoggedIn(true);
      setOtpVerified(true);
      setClientPhone(loginPhone);
      localStorage.setItem("clientPhone", loginPhone);
      localStorage.setItem("otpVerified", "true");
      localStorage.setItem("loggedIn", "true");
      loadMyAppointments(loginPhone);
      setLoginLoading(false);
      setView("my-appointments");
    }, 800);
  };

  const resetBooking = () => {
    setStep("landing"); setSelSvc(null); setSelEmp(null); setSelDate(null); setSelTime(null);
    setClientName(""); setClientPhone(""); setOtpSent(false); setOtp(""); setOtpVerified(false);
    setSection("book");
  };

  // ─── LOGIN VIEW ───
  if (view === "login") return (
    <>
      <style>{CSS}</style>
      <div style={S.app}>
        <div style={{background:`linear-gradient(135deg,${BUSINESS.coverGradient[0]},${BUSINESS.coverGradient[1]})`,padding:"60px 20px 28px",color:"white",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:8}}>📋</div>
          <div style={{fontSize:22,fontWeight:900}}>התורים שלי</div>
          <div style={{fontSize:13,opacity:0.8,marginTop:6}}>{BUSINESS.name}</div>
        </div>
        <div style={{padding:"24px 20px"}}>
          <div style={{fontSize:15,fontWeight:700,color:"#1e1b4b",marginBottom:6}}>הכנס את מספר הטלפון שלך</div>
          <div style={{fontSize:13,color:"#9ca3af",marginBottom:20}}>נשלח לך קוד אימות כדי לצפות בתורים שלך</div>
          <label style={S.label}>מספר טלפון</label>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            <input style={{...S.input,flex:1,direction:"ltr",marginBottom:0}} placeholder="050-0000000" value={loginPhone} onChange={e=>setLoginPhone(e.target.value)} disabled={loginOtpSent} />
            {!loggedIn && <button style={{...S.btnSm("#7c3aed","white"),borderRadius:12,padding:"0 16px",opacity:loginOtpSent?0.5:1}} onClick={sendLoginOtp} disabled={loginOtpSent}>
              {loginLoading&&!loginOtpSent?"...":loginOtpSent?"נשלח ✓":"שלח קוד"}
            </button>}
          </div>
          {loginOtpSent && !loggedIn && (
            <div className="fadeUp">
              <div style={{fontSize:14,fontWeight:700,color:"#1e1b4b",marginBottom:12,textAlign:"center"}}>📱 הכנס את הקוד שנשלח</div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
                {[0,1,2,3].map(i=>(
                  <input key={i} style={{...S.otpInput,borderColor:loginOtp.length>i?accent:"#e5e7eb"}} maxLength={1} value={loginOtp[i]||""} onChange={e=>{const v=e.target.value;setLoginOtp(p=>(p.slice(0,i)+v+p.slice(i+1)).slice(0,4));}} />
                ))}
              </div>
              <button style={S.btnPri(loginOtp.length<4)} onClick={verifyLoginOtp} disabled={loginOtp.length<4}>
                {loginLoading?"מאמת...":"✅ כניסה לתורים שלי"}
              </button>
            </div>
          )}
          <button style={{...S.btnOut,marginTop:12}} onClick={()=>setView("booking")}>← חזור להזמנת תור</button>
        </div>
      </div>
    </>
  );

  // ─── MY APPOINTMENTS VIEW ───
  if (view === "my-appointments") return (
    <>
      <style>{CSS}</style>
      <div style={S.app}>
        <div style={{background:`linear-gradient(135deg,${BUSINESS.coverGradient[0]},${BUSINESS.coverGradient[1]})`,padding:"52px 20px 20px",color:"white"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <button style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",borderRadius:10,padding:"8px 12px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Heebo',sans-serif"}} onClick={()=>setView("booking")}>← חזור</button>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:900}}>📋 התורים שלי</div>
              <div style={{fontSize:11,opacity:0.8,marginTop:2}}>{loginPhone||clientPhone}</div>
            </div>
            <button style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",borderRadius:10,padding:"8px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Heebo',sans-serif"}} onClick={()=>{setView("booking");setSection("book");setStep("landing");}}>＋ תור</button>
          </div>
        </div>

        <div style={S.tabBar}>
          {[{id:"upcoming",label:"⏳ קרובים"},{id:"done",label:"✅ עבר"},{id:"cancelled",label:"❌ בוטלו"}].map(t=>{
            const count = myAppts.filter(a=>a.status===t.id).length;
            return <button key={t.id} style={{...S.tab(section===t.id),position:"relative"}} onClick={()=>setSection(t.id)}>
              {t.label}
              {count>0&&<span style={{position:"absolute",top:6,right:6,width:16,height:16,borderRadius:"50%",background:accent,color:"white",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>{count}</span>}
            </button>;
          })}
        </div>

        <div style={S.content}>
          {myAppts.filter(a=>a.status===section).length === 0
            ? <div style={{textAlign:"center",padding:"48px 0",color:"#9ca3af"}} className="fadeUp">
                <div style={{fontSize:48}}>{section==="upcoming"?"📭":section==="done"?"🎉":"🚫"}</div>
                <div style={{fontSize:15,fontWeight:700,color:"#374151",marginTop:12}}>
                  {section==="upcoming"?"אין תורים קרובים":section==="done"?"אין תורים שעברו":"אין תורים שבוטלו"}
                </div>
                {section==="upcoming"&&<button style={{...S.btnPri(false),maxWidth:220,margin:"20px auto 0"}} onClick={()=>{setView("booking");setSection("book");}}>＋ קבע תור עכשיו</button>}
              </div>
            : myAppts.filter(a=>a.status===section).map((appt,idx)=>(
              <div key={appt.id} className="fadeUp" style={{...S.card,borderRight:`4px solid ${section==="upcoming"?accent:section==="done"?"#10b981":"#ef4444"}`,animationDelay:`${idx*0.06}s`}}>
                <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:12}}>
                  <div style={S.emojiBox}>{appt.serviceEmoji||"📅"}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:15,fontWeight:800,color:"#1e1b4b"}}>{appt.service}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>👷 {appt.employee||appt.employee_name||""}</div>
                    <div style={{fontSize:12,color:"#6b7280",marginTop:1}}>🏪 {appt.business||BUSINESS.name}</div>
                  </div>
                  <div style={{fontSize:16,fontWeight:900,color:accent}}>₪{appt.price||""}</div>
                </div>
                <div style={{display:"flex",gap:8,marginBottom:12}}>
                  <div style={{flex:1,background:"#f9f7ff",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>📅 תאריך</div>
                    <div style={{fontSize:13,fontWeight:800,color:"#1e1b4b",marginTop:2}}>{appt.date}</div>
                  </div>
                  <div style={{flex:1,background:"#f9f7ff",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>⏰ שעה</div>
                    <div style={{fontSize:13,fontWeight:800,color:"#1e1b4b",marginTop:2}}>{appt.time}</div>
                  </div>
                  <div style={{flex:1,background:"#f9f7ff",borderRadius:10,padding:"8px 10px",textAlign:"center"}}>
                    <div style={{fontSize:10,color:"#9ca3af",fontWeight:600}}>⏱ משך</div>
                    <div style={{fontSize:13,fontWeight:800,color:"#1e1b4b",marginTop:2}}>{appt.duration}′</div>
                  </div>
                </div>
                {appt.note && <div style={{fontSize:12,color:"#a78bfa",marginBottom:10,fontStyle:"italic"}}>💬 {appt.note}</div>}
                {section === "upcoming" && (
                  <div style={{display:"flex",gap:8}}>
                    <button style={{...S.btnSm(`linear-gradient(135deg,${accent},#4f46e5)`,"white"),flex:1,borderRadius:10,padding:"9px"}} onClick={()=>window.open(`https://waze.com/ul?q=${encodeURIComponent(BUSINESS.address)}`,'_blank')}>🗺️ נווט</button>
                    <button style={{...S.btnSm("#fee2e2","#dc2626"),flex:1,borderRadius:10,padding:"9px"}} onClick={()=>setCancelId(appt.id)}>✕ בטל</button>
                  </div>
                )}
                {section === "done" && !reviewedIds.includes(appt.id) && (
                  <button style={{...S.btnSm("#fef3c7","#92400e"),width:"100%",borderRadius:10,padding:"9px",border:"1px solid #fde68a"}} onClick={()=>setReviewId(appt.id)}>⭐ השאר ביקורת</button>
                )}
                {section === "done" && reviewedIds.includes(appt.id) && (
                  <div style={{background:"#d1fae5",borderRadius:10,padding:"8px 12px",fontSize:13,fontWeight:700,color:"#065f46",textAlign:"center"}}>✅ תודה על הביקורת!</div>
                )}
                {section === "cancelled" && (
                  <button style={{...S.btnSm("#f9f7ff",accent),width:"100%",borderRadius:10,padding:"9px",border:`1px solid #ede9fe`}} onClick={()=>{setView("booking");setSection("book");}}>🔄 קבע מחדש</button>
                )}
              </div>
            ))
          }
          {section === "upcoming" && myAppts.filter(a=>a.status==="upcoming").length > 0 && (
            <button style={{...S.btnOut,marginTop:8}} onClick={()=>{setView("booking");setSection("book");}}>＋ הוסף תור נוסף</button>
          )}
        </div>

        {cancelId && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end",backdropFilter:"blur(3px)"}}>
            <div style={{background:"white",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:"24px 20px 36px"}} className="fadeUp">
              <div style={{width:36,height:4,borderRadius:2,background:"#e5e7eb",margin:"0 auto 18px"}}/>
              <div style={{fontSize:18,fontWeight:900,color:"#1e1b4b",textAlign:"center",marginBottom:6}}>ביטול תור</div>
              <div style={{fontSize:14,color:"#6b7280",textAlign:"center",marginBottom:24}}>האם אתה בטוח שברצונך לבטל?</div>
              <div style={{display:"flex",gap:10}}>
                <button style={{...S.btnOut,flex:1}} onClick={()=>setCancelId(null)}>חזור</button>
                <button style={{flex:1,background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:12,padding:"13px",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:"'Heebo',sans-serif"}} onClick={()=>cancelAppt(cancelId)}>✕ בטל תור</button>
              </div>
            </div>
          </div>
        )}

        {reviewId && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:200,display:"flex",alignItems:"flex-end",backdropFilter:"blur(3px)"}}>
            <div style={{background:"white",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:430,margin:"0 auto",padding:"24px 20px 36px"}} className="fadeUp">
              <div style={{width:36,height:4,borderRadius:2,background:"#e5e7eb",margin:"0 auto 18px"}}/>
              <div style={{fontSize:18,fontWeight:900,color:"#1e1b4b",textAlign:"center",marginBottom:16}}>⭐ דרג את הביקור</div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:16}}>
                {[1,2,3,4,5].map(s=><span key={s} style={{fontSize:32,cursor:"pointer",filter:s<=reviewStars?"none":"grayscale(1)"}} onClick={()=>setReviewStars(s)}>⭐</span>)}
              </div>
              <textarea style={{...S.input,resize:"none",height:80,marginBottom:14}} placeholder="ספר/י לנו על החוויה שלך..." value={reviewText} onChange={e=>setReviewText(e.target.value)} />
              <button style={S.btnPri(reviewText.length<3)} onClick={submitReview} disabled={reviewText.length<3}>שלח ביקורת</button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // ─── BOOKING FLOW ───
  if (step === "landing") return (
    <>
      <style>{CSS}</style>
      <div style={S.app}>
        <div style={S.cover}>
          <div style={{position:"absolute",top:-20,left:-20,fontSize:140,opacity:0.07,lineHeight:1,pointerEvents:"none"}}>{BUSINESS.coverEmoji}</div>
          <div style={{position:"relative",zIndex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{fontSize:28,marginBottom:6}}>{BUSINESS.coverEmoji}</div>
                <div style={{fontSize:24,fontWeight:900,letterSpacing:-0.5}}>{BUSINESS.name}</div>
                <div style={{fontSize:13,opacity:0.85,marginTop:3}}>{BUSINESS.tagline}</div>
              </div>
              <button style={{background:"rgba(255,255,255,0.22)",border:"2px solid rgba(255,255,255,0.4)",color:"white",borderRadius:12,padding:"8px 12px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'Heebo',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:2}} onClick={()=>loggedIn?setView("my-appointments"):setView("login")}>
                <span style={{fontSize:20}}>📋</span>
                <span>התורים שלי</span>
              </button>
            </div>
            <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(255,255,255,0.2)",borderRadius:20,padding:"5px 12px",fontSize:13,fontWeight:700}}>
              ⭐ {BUSINESS.rating} <span style={{opacity:0.7}}>({BUSINESS.reviewCount})</span>
            </div>
            <div style={{fontSize:12,opacity:0.7,marginTop:8}}>📍 {BUSINESS.address}</div>
          </div>
        </div>

        <div style={S.tabBar}>
          {[{id:"book",label:"📅 הזמן תור"},{id:"about",label:"ℹ️ אודות"},{id:"reviews",label:"⭐ ביקורות"}].map(t=>(
            <button key={t.id} style={S.tab(section===t.id)} onClick={()=>setSection(t.id)}>{t.label}</button>
          ))}
        </div>

        <div style={S.content}>
          {section === "book" && <>
            {loggedIn && myAppts.filter(a=>a.status==="upcoming").length>0 && (
              <div style={{background:`linear-gradient(135deg,${accent}18,${accent}08)`,border:`1.5px solid ${accent}30`,borderRadius:14,padding:"12px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setView("my-appointments")}>
                <span style={{fontSize:22}}>📋</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#1e1b4b"}}>יש לך {myAppts.filter(a=>a.status==="upcoming").length} תורים קרובים</div>
                  <div style={{fontSize:12,color:"#6b7280",marginTop:1}}>לחץ לצפייה ←</div>
                </div>
              </div>
            )}
            <div style={S.sTitle}>בחר שירות</div>
            {SERVICES.map(svc=>(
              <div key={svc.id} style={S.svcCard(selSvc?.id===svc.id)} onClick={()=>setSelSvc(svc)}>
                <div style={S.emojiBox}>{svc.emoji}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:15,fontWeight:700,color:"#1e1b4b"}}>{svc.name}</div>
                  <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{svc.duration} דקות</div>
                </div>
                <div style={{fontSize:16,fontWeight:900,color:accent}}>₪{svc.price}</div>
                {selSvc?.id===svc.id&&<div style={{width:22,height:22,borderRadius:"50%",background:accent,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:13,fontWeight:900}}>✓</div>}
              </div>
            ))}
          </>}

          {section === "about" && <>
            <div style={S.sTitle}>אודות</div>
            <div style={{...S.card,marginBottom:14}}>
              <p style={{fontSize:14,color:"#374151",lineHeight:1.7,marginBottom:12}}>{BUSINESS.about}</p>
              {[{icon:"📍",l:"כתובת",v:BUSINESS.address},{icon:"📞",l:"טלפון",v:BUSINESS.phone},{icon:"📸",l:"אינסטגרם",v:BUSINESS.instagram}].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderTop:"1px solid #f3f4f6"}}>
                  <span style={{fontSize:18,flexShrink:0}}>{r.icon}</span>
                  <div><div style={{fontSize:11,color:"#9ca3af",fontWeight:600}}>{r.l}</div><div style={{fontSize:14,fontWeight:600,color:"#1e1b4b",marginTop:2}}>{r.v}</div></div>
                </div>
              ))}
            </div>
            <div style={S.sTitle}>שעות פעילות</div>
            <div style={S.card}>
              {BUSINESS.hours.map((h,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<BUSINESS.hours.length-1?"1px solid #f3f4f6":"none"}}>
                  <div style={{fontSize:14,fontWeight:600,color:"#374151"}}>{h.day}</div>
                  <div style={{fontSize:14,fontWeight:700,color:h.time==="סגור"?"#ef4444":accent}}>{h.time}</div>
                </div>
              ))}
            </div>
            <div style={{...S.sTitle,marginTop:4}}>הצוות</div>
            {EMPLOYEES.map(emp=>(
              <div key={emp.id} style={{...S.card,display:"flex",alignItems:"center",gap:12}}>
                <div style={S.avatar(emp.color)}>{emp.avatar}</div>
                <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#1e1b4b"}}>{emp.name}</div><div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{emp.role}</div></div>
                <div style={{textAlign:"center"}}><div style={S.stars}>⭐</div><div style={{fontSize:13,fontWeight:800,color:"#1e1b4b"}}>{emp.rating}</div></div>
              </div>
            ))}
          </>}

          {section === "reviews" && <>
            <div style={{background:`linear-gradient(135deg,${BUSINESS.coverGradient[0]},${BUSINESS.coverGradient[1]})`,borderRadius:16,padding:20,marginBottom:14,color:"white",textAlign:"center"}}>
              <div style={{fontSize:48,fontWeight:900}}>{BUSINESS.rating}</div>
              <div style={S.stars}>{"⭐".repeat(5)}</div>
              <div style={{fontSize:13,opacity:0.8,marginTop:6}}>{BUSINESS.reviewCount} ביקורות</div>
            </div>
            {REVIEWS.map((r,i)=>(
              <div key={i} style={S.card}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#1e1b4b"}}>{r.name}</div>
                  <div style={{fontSize:11,color:"#9ca3af"}}>{r.date}</div>
                </div>
                <div style={S.stars}>{"⭐".repeat(r.rating)}</div>
                <p style={{fontSize:14,color:"#374151",marginTop:8,lineHeight:1.6}}>{r.text}</p>
              </div>
            ))}
          </>}
        </div>

        {section === "book" && (
          <div style={S.sticky}>
            <button style={S.btnPri(!selSvc)} onClick={()=>selSvc&&setStep("employee")}>
              {selSvc?`המשך — ${selSvc.name} ₪${selSvc.price} ←`:"בחר שירות לקביעת תור"}
            </button>
          </div>
        )}
      </div>
    </>
  );

  const StepBar = ({stepNum, total, onBack}) => (
    <div style={{background:`linear-gradient(135deg,${BUSINESS.coverGradient[0]},${BUSINESS.coverGradient[1]})`,padding:"48px 16px 16px",color:"white"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <button style={{background:"rgba(255,255,255,0.2)",border:"none",color:"white",borderRadius:10,padding:"8px 12px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'Heebo',sans-serif"}} onClick={onBack}>← חזור</button>
        <div style={{fontSize:13,fontWeight:700,opacity:0.9}}>{BUSINESS.name}</div>
        <div style={{width:60}}/>
      </div>
      <div style={{display:"flex",gap:6,justifyContent:"center"}}>
        {[...Array(total)].map((_,i)=>(
          <div key={i} style={{width:i+1===stepNum?24:8,height:8,borderRadius:4,background:i+1<=stepNum?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.3)",transition:"all 0.3s"}}/>
        ))}
      </div>
    </div>
  );

  if (step === "employee") return (
    <>
      <style>{CSS}</style>
      <div style={{...S.app,paddingBottom:100}}>
        <StepBar stepNum={2} total={5} onBack={()=>setStep("landing")} />
        <div style={S.content}>
          <div style={S.sTitle}>עם מי תרצה/י לקבוע?</div>
          <div style={{...S.sumBox,display:"flex",gap:10,alignItems:"center",marginBottom:16}}>
            <span style={{fontSize:20}}>{selSvc.emoji}</span>
            <div><div style={{fontSize:14,fontWeight:700,color:"#1e1b4b"}}>{selSvc.name}</div><div style={{fontSize:12,color:"#9ca3af"}}>{selSvc.duration} דקות · ₪{selSvc.price}</div></div>
          </div>
          {availEmp.map(emp=>(
            <div key={emp.id} style={S.empCard(selEmp?.id===emp.id)} onClick={()=>setSelEmp(emp)}>
              <div style={S.avatar(emp.color)}>{emp.avatar}</div>
              <div style={{flex:1}}><div style={{fontSize:15,fontWeight:700,color:"#1e1b4b"}}>{emp.name}</div><div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{emp.role}</div></div>
              <div style={{textAlign:"center"}}><div style={S.stars}>⭐</div><div style={{fontSize:13,fontWeight:800}}>{emp.rating}</div></div>
              {selEmp?.id===emp.id&&<div style={{width:22,height:22,borderRadius:"50%",background:accent,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:13,fontWeight:900}}>✓</div>}
            </div>
          ))}
          <div style={{...S.card,cursor:"pointer",textAlign:"center",color:"#9ca3af",fontSize:14,fontWeight:600,border:"2px dashed #e5e7eb"}} onClick={()=>{setSelEmp(EMPLOYEES[0]);setStep("datetime");}}>
            🎲 אין לי העדפה
          </div>
        </div>
        <div style={S.sticky}>
          <button style={S.btnPri(!selEmp)} onClick={()=>selEmp&&setStep("datetime")}>המשך ← בחר תאריך ושעה</button>
        </div>
      </div>
    </>
  );

  if (step === "datetime") return (
    <>
      <style>{CSS}</style>
      <div style={{...S.app,paddingBottom:100}}>
        <StepBar stepNum={3} total={5} onBack={()=>setStep("employee")} />
        <div style={S.content}>
          <div style={S.sTitle}>בחר תאריך</div>
          <div style={S.dateRow}>
            {AVAILABLE_DATES.map(d=>(
              <div key={d.date} style={S.dateChip(selDate===d.date)} onClick={()=>{setSelDate(d.date);setSelTime(null);}}>
                <div style={{fontSize:11,fontWeight:700,color:selDate===d.date?"rgba(255,255,255,0.8)":"#9ca3af"}}>{d.day}</div>
                <div style={{fontSize:14,fontWeight:900,marginTop:2,color:selDate===d.date?"white":"#1e1b4b"}}>{d.label}</div>
              </div>
            ))}
          </div>
          {selDate && <>
            <div style={S.sTitle}>שעות פנויות</div>
            <div style={S.timeGrid}>
              {availableTimes.map(t=>(
                <div key={t} style={S.timeChip(selTime===t)} onClick={()=>setSelTime(t)}>{t}</div>
              ))}
            </div>
            {availableTimes.length === 0 && <div style={{textAlign:"center",color:"#9ca3af",padding:"24px 0",fontSize:14}}>אין שעות פנויות ביום זה</div>}
          </>}
          {!selDate && <div style={{textAlign:"center",color:"#9ca3af",padding:"32px 0",fontSize:14}}>בחר תאריך לראות שעות פנויות</div>}
        </div>
        <div style={S.sticky}>
          <button style={S.btnPri(!selDate||!selTime)} onClick={()=>selDate&&selTime&&setStep("details")}>המשך ← פרטים אישיים</button>
        </div>
      </div>
    </>
  );

  if (step === "details") return (
    <>
      <style>{CSS}</style>
      <div style={{...S.app,paddingBottom:100}}>
        <StepBar stepNum={4} total={5} onBack={()=>setStep("datetime")} />
        <div style={S.content}>
          <div style={S.sTitle}>פרטים אישיים</div>
          <div style={S.sumBox}>
            {[{l:"שירות",v:`${selSvc.emoji} ${selSvc.name}`},{l:"מטפלת",v:selEmp.name},{l:"תאריך",v:AVAILABLE_DATES.find(d=>d.date===selDate)?.label},{l:"שעה",v:selTime},{l:"מחיר",v:`₪${selSvc.price}`}].map((r,i)=>(
              <div key={i} style={S.sumRow}><span style={{fontSize:13,color:"#6b7280"}}>{r.l}</span><span style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>{r.v}</span></div>
            ))}
          </div>
          <label style={S.label}>שם מלא *</label>
          <input style={{...S.input,marginBottom:12}} placeholder="שם פרטי ומשפחה" value={clientName} onChange={e=>setClientName(e.target.value)} />
          <label style={S.label}>מספר טלפון *</label>
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            <input style={{...S.input,flex:1,direction:"ltr",marginBottom:0}} placeholder="050-0000000" value={clientPhone} onChange={e=>setClientPhone(e.target.value)} disabled={otpSent} />
            {!otpVerified&&<button style={{...S.btnSm(`linear-gradient(135deg,${accent},#4f46e5)`,"white"),borderRadius:10,padding:"0 14px",opacity:otpSent?0.55:1,flexShrink:0}} onClick={sendBookingOtp} disabled={otpSent}>
              {loading&&!otpSent?"...":otpSent?"נשלח ✓":"שלח קוד"}
            </button>}
          </div>
          {otpSent&&!otpVerified&&(
            <div style={{background:"#f0fdf4",borderRadius:14,padding:16,marginBottom:14,border:"1px solid #bbf7d0",textAlign:"center"}} className="fadeUp">
              <div style={{fontSize:14,fontWeight:700,color:"#065f46",marginBottom:12}}>📱 הכנס את הקוד שנשלח</div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:12}}>
                {[0,1,2,3].map(i=>(
                  <input key={i} style={{...S.otpInput,borderColor:otp.length>i?"#10b981":"#e5e7eb"}} maxLength={1} value={otp[i]||""} onChange={e=>{const v=e.target.value;setOtp(p=>(p.slice(0,i)+v+p.slice(i+1)).slice(0,4));}} />
                ))}
              </div>
              <button style={S.btnPri(otp.length<4)} onClick={verifyBookingOtp} disabled={otp.length<4}>{loading?"מאמת...":"✅ אמת"}</button>
            </div>
          )}
          {otpVerified&&<div style={{background:"#d1fae5",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:18}}>✅</span><span style={{fontSize:13,fontWeight:700,color:"#065f46"}}>טלפון אומת!</span></div>}
          <label style={S.label}>הערה (אופציונלי)</label>
          <textarea style={{...S.input,resize:"vertical",height:70,marginBottom:0}} placeholder="אלרגיות, בקשות מיוחדות..." value={clientNote} onChange={e=>setClientNote(e.target.value)} />
        </div>
        <div style={S.sticky}>
          <button style={S.btnPri(!clientName||!otpVerified)} onClick={()=>clientName&&otpVerified&&setStep("confirm")}>המשך ← אישור תור</button>
        </div>
      </div>
    </>
  );

  if (step === "confirm") return (
    <>
      <style>{CSS}</style>
      <div style={{...S.app,paddingBottom:100}}>
        <StepBar stepNum={5} total={5} onBack={()=>setStep("details")} />
        <div style={S.content}>
          <div style={S.sTitle}>אישור התור</div>
          <div style={{...S.sumBox,padding:18}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:40}}>{selSvc.emoji}</div>
              <div style={{fontSize:18,fontWeight:900,color:"#1e1b4b",marginTop:6}}>{selSvc.name}</div>
              <div style={{fontSize:12,color:"#9ca3af",marginTop:3}}>{BUSINESS.name}</div>
            </div>
            <div style={{height:1,background:"#f0eeff",marginBottom:12}}/>
            {[{l:"👤 שם",v:clientName},{l:"📞 טלפון",v:clientPhone},{l:"👷 מטפלת",v:selEmp.name},{l:"📅 תאריך",v:AVAILABLE_DATES.find(d=>d.date===selDate)?.label},{l:"⏰ שעה",v:selTime},{l:"⏱ משך",v:`${selSvc.duration} דקות`}].map((r,i)=>(
              <div key={i} style={S.sumRow}><span style={{fontSize:13,color:"#6b7280"}}>{r.l}</span><span style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>{r.v}</span></div>
            ))}
            <div style={{height:1,background:"#f0eeff",margin:"10px 0"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:15,fontWeight:800,color:"#1e1b4b"}}>סה"כ</span>
              <span style={{fontSize:20,fontWeight:900,color:accent}}>₪{selSvc.price}</span>
            </div>
          </div>
          <div style={{background:"#fef3c7",borderRadius:12,padding:"12px 14px",marginBottom:12,display:"flex",gap:8,border:"1px solid #fde68a"}}>
            <span>📱</span><div style={{fontSize:13,color:"#92400e",lineHeight:1.6}}>תקבל/י SMS ווואטסאפ עם אישור התור ותזכורת לפני.</div>
          </div>
          {clientNote&&<div style={{background:"#f9f7ff",borderRadius:12,padding:"12px 14px",marginBottom:12,border:"1px solid #ede9fe"}}><div style={{fontSize:12,color:"#9ca3af",marginBottom:4}}>הערה</div><div style={{fontSize:13,color:"#374151"}}>{clientNote}</div></div>}
        </div>
        <div style={S.sticky}>
          <button style={S.btnPri(loading)} onClick={confirmBooking}>{loading?"מאשר...":"✅ אשר תור"}</button>
          <div style={{fontSize:11,color:"#9ca3af",textAlign:"center",marginTop:8}}>ניתן לבטל עד 2 שעות לפני</div>
        </div>
      </div>
    </>
  );

  if (step === "success") return (
    <>
      <style>{CSS}</style>
      <div style={{...S.app,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:24,textAlign:"center"}}>
        <div style={{fontSize:72,animation:"pop 0.4s ease"}}>🎉</div>
        <div style={{fontSize:24,fontWeight:900,color:"#1e1b4b",marginBottom:6,marginTop:8}}>התור נקבע!</div>
        <div style={{fontSize:14,color:"#6b7280",marginBottom:24,lineHeight:1.8}}>אישור נשלח ל-{clientPhone}<br/><span style={{fontSize:12}}>SMS + וואטסאפ</span></div>
        <div style={{...S.sumBox,width:"100%",maxWidth:360,textAlign:"right",marginBottom:20}}>
          <div style={{textAlign:"center",marginBottom:12}}><div style={{fontSize:36}}>{selSvc.emoji}</div><div style={{fontSize:17,fontWeight:900,color:"#1e1b4b",marginTop:4}}>{selSvc.name}</div></div>
          {[{l:"📅",v:AVAILABLE_DATES.find(d=>d.date===selDate)?.label},{l:"⏰",v:selTime},{l:"👷",v:selEmp.name},{l:"📍",v:BUSINESS.address}].map((r,i)=>(
            <div key={i} style={{display:"flex",gap:10,padding:"6px 0",borderBottom:i<3?"1px solid #f0eeff":"none"}}>
              <span style={{fontSize:16}}>{r.l}</span><span style={{fontSize:14,fontWeight:600,color:"#1e1b4b"}}>{r.v}</span>
            </div>
          ))}
        </div>
        <button style={{...S.btnPri(false),marginBottom:10,maxWidth:360}} onClick={()=>{setView("my-appointments");setSection("upcoming");}}>
          📋 צפה בתורים שלי
        </button>
        <button style={{...S.btnOut,maxWidth:360,marginBottom:10}} onClick={()=>window.open(`https://waze.com/ul?q=${encodeURIComponent(BUSINESS.address)}`,'_blank')}>
          🗺️ נווט לעסק
        </button>
        <button style={{background:"transparent",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer",fontFamily:"'Heebo',sans-serif",marginTop:4}} onClick={resetBooking}>
          קבע תור נוסף
        </button>
        <div style={{marginTop:20,fontSize:12,color:"#d1d5db"}}>
          <span style={{color:accent,fontWeight:700}}>daybookme.com</span>/{BUSINESS.slug}
        </div>
      </div>
    </>
  );

  return null;
}
