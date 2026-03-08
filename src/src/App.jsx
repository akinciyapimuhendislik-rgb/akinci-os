import { useState, useEffect, useCallback } from "react";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD7J6Q-S_-GoPDBOvBhFwIA6wgpoE58Y28",
  authDomain: "akinci-os.firebaseapp.com",
  projectId: "akinci-os",
  storageBucket: "akinci-os.firebasestorage.app",
  messagingSenderId: "873233677480",
  appId: "1:873233677480:web:ea5d9c1dbb4a9caafa169d"
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().split("T")[0];
const daysDiff = d => d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null;
const fmtDate = d => d ? new Date(d + "T00:00:00").toLocaleDateString("tr-TR") : "-";

const CURRENCIES = {
  TRY: { symbol: "₺", name: "Türk Lirası" },
  USD: { symbol: "$", name: "Dolar" },
  EUR: { symbol: "€", name: "Euro" },
  GBP: { symbol: "£", name: "Sterlin" },
  AED: { symbol: "د.إ", name: "Dirhem" },
  SAR: { symbol: "﷼", name: "Riyali" },
};

const fmt = (n, cur = "TRY") => {
  const sym = CURRENCIES[cur]?.symbol || "₺";
  const val = Math.abs(n || 0);
  const str = val >= 1000000 ? (val/1000000).toFixed(2)+"M" : val >= 1000 ? (val/1000).toFixed(1)+"K" : val.toLocaleString("tr-TR");
  return (n < 0 ? "-" : "") + sym + str;
};

const PHASES = ["Temel","Kaba İnşaat","Çatı","Sıva","Elektrik","Tesisat","İç Mekan","Boya","Zemin","Teslim"];
const EXP_CATS = ["Malzeme","İşçilik","Ekipman","Nakliye","Taşeron","Diğer"];
const REGIONS = ["İstanbul","Ankara","İzmir","Bursa","Antalya","Adana","Konya","Diğer"];
const REBAR = {"8":0.395,"10":0.617,"12":0.888,"14":1.208,"16":1.578,"20":2.466,"22":2.984,"25":3.853};
const REGION_FACTOR = {"İstanbul":1.25,"Ankara":1.10,"İzmir":1.15,"Bursa":1.05,"Antalya":1.08,"Adana":0.95,"Konya":0.92,"Diğer":1.0};
const COST_M2 = {
  "Kaba İnşaat":{min:7500,max:9500},
  "Orta Kalite":{min:12000,max:16000},
  "Yüksek Kalite":{min:18000,max:24000},
  "Lüks / Villa":{min:28000,max:45000},
};
const PRICES_2025 = {
  "Demir (ton)":{price:28000,unit:"ton"},
  "Çimento (ton)":{price:3500,unit:"ton"},
  "Kum (m³)":{price:420,unit:"m³"},
  "Mıcır (m³)":{price:490,unit:"m³"},
  "Tuğla (adet)":{price:5.8,unit:"adet"},
  "Seramik (m²)":{price:380,unit:"m²"},
  "Boya (kg)":{price:110,unit:"kg"},
  "Çift Cam (m²)":{price:1100,unit:"m²"},
  "Kapı (adet)":{price:6500,unit:"adet"},
  "Parke (m²)":{price:520,unit:"m²"},
};
const EQ_CHECKLIST = [
  "Zemin etüd raporu alındı",
  "Statik proje onaylandı",
  "Kolon-kiriş detayları TBDY 2018'e uygun",
  "Beton dayanımı min C25/30",
  "Donatı yerleşimi projeye uygun",
  "Beton dökümünde vibratör kullanıldı",
  "Kalıp söküm sürelerine uyuldu",
  "Perde duvarlar projeye göre yapıldı",
  "Temel sistemi zemin raporuna uygun",
  "Yapı denetim firması onayı alındı",
];

const C = {
  bg:"#0b0f18",card:"#131926",card2:"#1a2235",
  border:"#1e2d45",accent:"#c9952a",a2:"#3b82f6",
  green:"#10b981",red:"#ef4444",orange:"#f97316",
  purple:"#8b5cf6",cyan:"#06b6d4",text:"#e2ddd6",muted:"#64748b",
};
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700;800;900&family=Barlow+Condensed:wght@700;800;900&family=JetBrains+Mono:wght@400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#0b0f18;color:#e2ddd6;font-family:'Barlow',sans-serif;-webkit-tap-highlight-color:transparent;}
  input,textarea,select{background:#1a2235;border:1px solid #1e2d45;border-radius:10px;color:#e2ddd6;font-family:'Barlow',sans-serif;font-size:14px;padding:10px 12px;width:100%;outline:none;}
  input:focus,textarea:focus,select:focus{border-color:#c9952a;}
  select option{background:#131926;}
  button{cursor:pointer;font-family:'Barlow',sans-serif;border:none;}
  ::-webkit-scrollbar{width:2px;height:2px;}
  ::-webkit-scrollbar-thumb{background:#1e2d45;border-radius:2px;}
  @keyframes su{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}
  @keyframes fi{from{opacity:0}to{opacity:1}}
  .su{animation:su .25s ease;}
  .fi{animation:fi .2s ease;}
  .bar{transition:width .7s cubic-bezier(.4,0,.2,1);}
`;

const Badge = ({children,color=C.accent}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>
);
const Bar = ({pct,color=C.accent,h=7}) => (
  <div style={{background:"#0a0e18",borderRadius:99,height:h,overflow:"hidden"}}>
    <div className="bar" style={{width:`${Math.min(100,Math.max(0,pct||0))}%`,height:"100%",background:color,borderRadius:99}}/>
  </div>
);
const Stat = ({label,value,color=C.text,sub}) => (
  <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 12px",flex:1,minWidth:0}}>
    <div style={{fontSize:8,color:C.muted,fontWeight:700,letterSpacing:1.5,marginBottom:3}}>{label}</div>
    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:500,color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>
    {sub&&<div style={{fontSize:9,color:C.muted,marginTop:2}}>{sub}</div>}
  </div>
);
const Btn = ({children,onClick,color=C.accent,outline,small,full,disabled,style:sx={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background:outline?"transparent":color,color:outline?color:"#0b0f18",
    border:`1px solid ${color}`,borderRadius:10,
    padding:small?"5px 12px":"10px 18px",
    fontWeight:700,fontSize:small?11:14,
    width:full?"100%":"auto",opacity:disabled?.5:1,
    boxShadow:!outline?`0 2px 12px ${color}33`:"none",...sx
  }}>{children}</button>
);
const Field = ({label,children}) => (
  <div><div style={{fontSize:9,color:C.muted,fontWeight:700,marginBottom:4,letterSpacing:.5}}>{label}</div>{children}</div>
);
const SHdr = ({title,onAdd,addLabel="+ Ekle"}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}>
    <div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800}}>{title}</div>
    {onAdd&&<Btn small onClick={onAdd}>{addLabel}</Btn>}
  </div>
);
const Empty = ({icon,text}) => (
  <div style={{textAlign:"center",padding:"32px 16px",color:C.muted}}>
    <div style={{fontSize:32,marginBottom:7}}>{icon}</div>
    <div style={{fontSize:13}}>{text}</div>
  </div>
);
function Modal({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}>
      <div className="su" onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"20px 20px 0 0",padding:20,width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",border:`1px solid ${C.border}`,borderBottom:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:800,fontSize:16}}>{title}</div>
          <button onClick={onClose} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,padding:"3px 10px",fontSize:14}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function useFirebase(){
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  const [fns,setFns]=useState(null);

  useEffect(()=>{
    const s=document.createElement("script");
    s.type="module";
    s.textContent=`
      import{initializeApp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
      import{getFirestore,collection,onSnapshot,setDoc,deleteDoc,doc}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
      const app=initializeApp(${JSON.stringify(FIREBASE_CONFIG)});
      const db=getFirestore(app);
      window.__db=db;
      window.__fns={collection,onSnapshot,setDoc,deleteDoc,doc};
      window.dispatchEvent(new Event("fb_ready"));
    `;
    document.head.appendChild(s);
    const onReady=()=>{
      const db=window.__db;
      const{collection,onSnapshot}=window.__fns;
      setFns(window.__fns);
      onSnapshot(collection(db,"projects"),snap=>{
        setProjects(snap.docs.map(d=>({id:d.id,...d.data()})));
        setLoading(false);
      },()=>setLoading(false));
    };
    window.addEventListener("fb_ready",onReady);
    return()=>window.removeEventListener("fb_ready",onReady);
  },[]);

  const save=useCallback(async(proj)=>{
    if(!window.__fns)return;
    const{setDoc,doc}=window.__fns;
    await setDoc(doc(window.__db,"projects",proj.id),proj);
  },[]);

  const remove=useCallback(async(id)=>{
    if(!window.__fns)return;
    const{deleteDoc,doc}=window.__fns;
    await deleteDoc(doc(window.__db,"projects",id));
  },[]);

  return{projects,loading,save,remove};
}

function SplashScreen(){
  return(
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:9}}>
      <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:48,color:C.accent,letterSpacing:5}}>AKINCI</div>
      <div style={{fontSize:13,color:C.muted,letterSpacing:7}}>OS</div>
      <div style={{marginTop:26,width:100,height:3,background:C.border,borderRadius:99,overflow:"hidden"}}>
        <div style={{width:"55%",height:"100%",background:`linear-gradient(90deg,${C.accent},#f5c842)`,borderRadius:99}}/>
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:6,letterSpacing:2}}>Akıncı Yapı & Mühendislik</div>
      <div style={{fontSize:11,color:C.muted,marginTop:4,opacity:.6}}>Yükleniyor...</div>
    </div>
  );
}

function HomeScreen({projects,onSelect,onAdd,onDelete}){
  const totalBudget=projects.reduce((s,p)=>s+(p.budget||0),0);
  const totalSpent=projects.reduce((s,p)=>s+(p.expenses||[]).reduce((x,e)=>x+e.amount,0),0);
  return(
    <div style={{background:C.bg,minHeight:"100vh"}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"48px 16px 15px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:C.accent,letterSpacing:3,lineHeight:1}}>AKINCI</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:5}}>OS · İnşaat Yönetim</div>
          </div>
          <button onClick={onAdd} style={{background:C.accent,color:"#0b0f18",borderRadius:12,width:42,height:42,fontSize:22,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 16px ${C.accent}44`}}>+</button>
        </div>
        {projects.length>0&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
            <Stat label="TOPLAM BÜTÇE" value={fmt(totalBudget)} color={C.accent}/>
            <Stat label="TOPLAM HARCAMA" value={fmt(totalSpent)} color={C.orange}/>
            <Stat label="AKTİF PROJE" value={`${projects.length} proje`} color={C.a2}/>
            <Stat label="TOPLAM KALAN" value={fmt(totalBudget-totalSpent)} color={C.green}/>
          </div>
        )}
      </div>
      <div style={{padding:"14px 14px 100px"}}>
        {projects.length===0?(
          <div style={{textAlign:"center",marginTop:80}}>
            <div style={{fontSize:54,marginBottom:13}}>🏗️</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22,color:C.muted}}>Henüz proje yok</div>
            <div style={{fontSize:13,color:C.muted,marginTop:6,opacity:.6}}>+ butonuna bas</div>
          </div>
        ):projects.map(proj=>{
          const spent=(proj.expenses||[]).reduce((s,e)=>s+e.amount,0);
          const pct=proj.budget?Math.min(100,(spent/proj.budget)*100):0;
          const phIdx=PHASES.indexOf(proj.phase||"Temel");
          const prog=Math.round(((phIdx+(proj.phaseProgress||0)/100)/PHASES.length)*100);
          const cur=proj.currency||"TRY";
          return(
            <div key={proj.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:15,marginBottom:10,cursor:"pointer"}} onClick={()=>onSelect(proj.id)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{proj.name}</div>
                  {proj.location&&<div style={{fontSize:11,color:C.muted}}>📍 {proj.location}</div>}
                </div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:C.accent}}>%{prog}</div>
              </div>
              <Bar pct={prog} h={5}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginTop:9}}>
                <div style={{background:C.card2,borderRadius:6,padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>BÜTÇE</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:600}}>{fmt(proj.budget,cur)}</div></div>
                <div style={{background:C.card2,borderRadius:6,padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>HARCANAN</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:600,color:pct>90?C.red:C.text}}>{fmt(spent,cur)}</div></div>
                <div style={{background:C.card2,borderRadius:6,padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>KALAN</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:600,color:proj.budget-spent<0?C.red:C.green}}>{fmt(proj.budget-spent,cur)}</div></div>
              </div>
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:9}}>
                <button onClick={e=>{e.stopPropagation();if(confirm("Projeyi sil?"))onDelete(proj.id);}} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:7,color:C.red,padding:"4px 10px",fontSize:11}}>Sil</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NewProjectScreen({onSave,onBack}){
  const [form,setForm]=useState({name:"",location:"",budget:"",currency:"TRY",region:"İstanbul",startDate:today(),endDate:""});
  function save(){
    if(!form.name||!form.budget)return;
    const proj={id:uid(),...form,budget:parseFloat(form.budget),phase:"Temel",phaseProgress:0,expenses:[],notes:[],senets:[],calendar:[],credits:[],contractors:[],workers:[],puantaj:[],materials:[],orders:[],quotes:[],risks:[],accidents:[],insurances:[],meetings:[],tasks:[],issues:[],hakedisler:[],creditSales:[],earthquakeChecks:{},createdAt:today()};
    onSave(proj);
  }
  return(
    <div style={{background:C.bg,minHeight:"100vh",padding:"48px 16px 100px"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
        <button onClick={onBack} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",fontSize:15}}>←</button>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22}}>Yeni Proje</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Field label="PROJE ADI *"><input placeholder="Kadıköy Konut Projesi" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
        <Field label="KONUM"><input placeholder="İlçe, Şehir" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          <Field label="PARA BİRİMİ"><select value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>{Object.entries(CURRENCIES).map(([k,v])=><option key={k} value={k}>{v.symbol} {k}</option>)}</select></Field>
          <Field label="BÖLGE"><select value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></Field>
        </div>
        <Field label="TOPLAM BÜTÇE *"><input type="number" placeholder="5000000" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))}/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          <Field label="BAŞLANGIÇ"><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></Field>
          <Field label="BİTİŞ"><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></Field>
        </div>
        <button onClick={save} style={{background:`linear-gradient(135deg,${C.accent},#f5c842)`,color:"#0b0f18",borderRadius:12,padding:"14px",fontWeight:900,fontSize:15,marginTop:6,boxShadow:`0 4px 20px ${C.accent}44`,fontFamily:"'Barlow',sans-serif",border:"none"}}>🏗️ Proje Oluştur</button>
      </div>
    </div>
  );
}
const PROJ_TABS=[
  {key:"ozet",label:"📊 Özet"},{key:"harcama",label:"💸 Harcama"},
  {key:"finans",label:"🏦 Finans"},{key:"personel",label:"👷 Personel"},
  {key:"malzeme",label:"📦 Malzeme"},{key:"takvim",label:"📅 Takvim"},
  {key:"asama",label:"🔨 Aşama"},{key:"kalite",label:"🛡️ Kalite"},
  {key:"yonetim",label:"📋 Yönetim"},{key:"hesap",label:"🧮 Hesap"},
  {key:"notlar",label:"📸 Notlar"},
];

function OzetModule({proj,updateProj}){
  const cur=proj.currency||"TRY";
  const spent=(proj.expenses||[]).reduce((s,e)=>s+e.amount,0);
  const pct=proj.budget?(spent/proj.budget)*100:0;
  const phIdx=PHASES.indexOf(proj.phase||"Temel");
  const prog=Math.round(((phIdx+(proj.phaseProgress||0)/100)/PHASES.length)*100);
  const overdue=(proj.senets||[]).filter(s=>s.status==="Bekliyor"&&daysDiff(s.dueDate)<0).length;
  const cats=EXP_CATS.map(cat=>({cat,total:(proj.expenses||[]).filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0)})).filter(c=>c.total>0);
  const colors=[C.accent,C.a2,C.green,C.purple,C.cyan,C.orange];
  return(
    <div className="fi" style={{display:"flex",flexDirection:"column",gap:11}}>
      {(overdue>0||pct>80)&&(
        <div style={{background:C.red+"15",border:`1px solid ${C.red}44`,borderRadius:12,padding:12}}>
          <div style={{fontSize:9,color:C.red,fontWeight:800,letterSpacing:2,marginBottom:6}}>⚠️ UYARILAR</div>
          {overdue>0&&<div style={{fontSize:12,color:C.red,marginBottom:2}}>• {overdue} vadesi geçmiş çek/senet</div>}
          {pct>80&&<div style={{fontSize:12,color:C.orange}}>• Bütçenin %{pct.toFixed(0)}'i kullanıldı</div>}
        </div>
      )}
      <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:15}}>
        <div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:11}}>BÜTÇE DURUMU</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:11}}>
          <Stat label="TOPLAM BÜTÇE" value={fmt(proj.budget,cur)}/>
          <Stat label="HARCANAN" value={fmt(spent,cur)} color={pct>80?C.red:C.green}/>
          <Stat label="KALAN" value={fmt((proj.budget||0)-spent,cur)} color={(proj.budget||0)-spent<0?C.red:C.a2}/>
          <Stat label="KULLANIM" value={`%${pct.toFixed(1)}`} color={pct>90?C.red:C.orange}/>
        </div>
        <Bar pct={pct} color={pct>90?C.red:C.a2}/>
      </div>
      <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:15}}>
        <div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:9}}>İNŞAAT İLERLEMESİ</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:42,lineHeight:1,color:C.accent}}>%{prog}</div>
          <div style={{textAlign:"right"}}>
            <div style={{fontWeight:700,color:C.green,fontSize:14}}>{proj.phase||"Temel"}</div>
            {proj.endDate&&<div style={{fontSize:10,color:daysDiff(proj.endDate)<0?C.red:C.muted,marginTop:3}}>{daysDiff(proj.endDate)<0?`${Math.abs(daysDiff(proj.endDate))} gün gecikti`:`${daysDiff(proj.endDate)} gün kaldı`}</div>}
          </div>
        </div>
        <Bar pct={prog} h={9}/>
      </div>
      {cats.length>0&&(
        <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:15}}>
          <div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:11}}>KATEGORİ DAĞILIMI</div>
          {cats.map((c,i)=>(
            <div key={c.cat} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}>
                <span style={{fontWeight:600}}>{c.cat}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",color:colors[i%6]}}>{fmt(c.total,cur)}</span>
              </div>
              <Bar pct={(c.total/spent)*100} color={colors[i%6]} h={5}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HarcamaModule({proj,updateProj}){
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("Tümü");
  const [form,setForm]=useState({title:"",amount:"",category:"Malzeme",date:today(),faturali:false,kdv:"20",note:""});
  const cur=proj.currency||"TRY";
  const expenses=proj.expenses||[];
  const filtered=filter==="Tümü"?expenses:filter==="Faturalı"?expenses.filter(e=>e.faturali):filter==="Faturasız"?expenses.filter(e=>!e.faturali):expenses.filter(e=>e.category===filter);
  const total=filtered.reduce((s,e)=>s+(e.total||e.amount),0);
  function add(){
    if(!form.title||!form.amount)return;
    const net=parseFloat(form.amount);
    const kdvAmt=form.faturali?net*(parseFloat(form.kdv)/100):0;
    updateProj(p=>({...p,expenses:[...(p.expenses||[]),{id:uid(),...form,amount:net,kdvAmount:kdvAmt,total:net+kdvAmt}]}));
    setForm({title:"",amount:"",category:"Malzeme",date:today(),faturali:false,kdv:"20",note:""});
    setShowAdd(false);
  }
  return(
    <div className="fi">
      <div style={{display:"flex",gap:5,marginBottom:11,overflowX:"auto",paddingBottom:3}}>
        {["Tümü","Faturalı","Faturasız",...EXP_CATS].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?C.accent:C.card2,color:filter===f?"#0b0f18":C.muted,border:`1px solid ${filter===f?C.accent:C.border}`,borderRadius:20,padding:"5px 11px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{f}</button>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",color:C.accent,fontWeight:700,fontSize:14}}>{fmt(total,cur)}</div>
        <Btn small onClick={()=>setShowAdd(true)}>+ Harcama Ekle</Btn>
      </div>
      {filtered.length===0?<Empty icon="💸" text="Harcama yok"/>:[...filtered].reverse().map(exp=>(
        <div key={exp.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,fontSize:13}}>{exp.title}</span>
              <Badge color={exp.faturali?C.green:C.orange}>{exp.faturali?"Faturalı":"Faturasız"}</Badge>
            </div>
            <div style={{fontSize:11,color:C.muted}}>{exp.category} · {fmtDate(exp.date)}</div>
            {exp.faturali&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>KDV %{exp.kdv}: {fmt(exp.kdvAmount,cur)}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent,fontSize:13}}>{fmt(exp.amount,cur)}</div>
            <button onClick={()=>updateProj(p=>({...p,expenses:(p.expenses||[]).filter(e=>e.id!==exp.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
          </div>
        </div>
      ))}
      {showAdd&&(
        <Modal title="Harcama Ekle" onClose={()=>setShowAdd(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Field label="AÇIKLAMA *"><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
            <Field label="TUTAR *"><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></Field>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <Field label="KATEGORİ"><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select></Field>
              <Field label="TARİH"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10,background:C.card2,borderRadius:10,padding:10}}>
              <input type="checkbox" checked={form.faturali} onChange={e=>setForm(f=>({...f,faturali:e.target.checked}))} style={{width:16,height:16}}/>
              <span style={{fontWeight:700,fontSize:13}}>Faturalı Ödeme</span>
            </div>
            {form.faturali&&<Field label="KDV ORANI (%)"><select value={form.kdv} onChange={e=>setForm(f=>({...f,kdv:e.target.value}))}>{["1","8","10","18","20"].map(r=><option key={r}>{r}</option>)}</select></Field>}
            <Btn full onClick={add}>Kaydet</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AsamaModule({proj,updateProj}){
  const phIdx=PHASES.indexOf(proj.phase||"Temel");
  const prog=Math.round(((phIdx+(proj.phaseProgress||0)/100)/PHASES.length)*100);
  return(
    <div className="fi">
      <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:15,marginBottom:13}}>
        <div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:9}}>AKTİF AŞAMA</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:40,color:C.accent,lineHeight:1}}>%{proj.phaseProgress||0}</div>
          <div style={{fontWeight:700,color:C.green,fontSize:14}}>{proj.phase||"Temel"}</div>
        </div>
        <input type="range" min="0" max="100" value={proj.phaseProgress||0} onChange={e=>updateProj(p=>({...p,phaseProgress:parseInt(e.target.value)}))} style={{width:"100%",accentColor:C.accent,background:"transparent",border:"none",padding:0,marginBottom:4}}/>
        <div style={{fontSize:9,color:C.muted,textAlign:"center"}}>Genel İlerleme: %{prog}</div>
      </div>
      {PHASES.map((phase,idx)=>{
        const isDone=idx<phIdx,isActive=idx===phIdx;
        return(
          <div key={phase} onClick={()=>updateProj(p=>({...p,phase,phaseProgress:isActive?p.phaseProgress:0}))} style={{background:isActive?C.accent+"15":isDone?C.green+"08":C.card2,border:`1px solid ${isActive?C.accent:isDone?C.green+"44":C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:isDone?C.green:isActive?C.accent:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:isDone||isActive?"#0b0f18":C.muted,flexShrink:0}}>{isDone?"✓":idx+1}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,color:isActive?C.accent:isDone?C.green:C.text}}>{phase}</div>
              <div style={{fontSize:10,color:C.muted}}>{isDone?"Tamamlandı":isActive?`Devam ediyor — %${proj.phaseProgress||0}`:"Bekliyor"}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TakvimModule({proj,updateProj}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({title:"",date:today(),type:"Görev",note:""});
  const cal=proj.calendar||[];
  const sorted=[...cal].sort((a,b)=>a.date>b.date?1:-1);
  const typeC={"Görev":C.a2,"Teslim":C.red,"Toplantı":C.purple,"Ödeme":C.accent,"Diğer":C.muted};
  return(
    <div className="fi">
      <SHdr title="TAKVİM & TERMİN" onAdd={()=>{setForm({title:"",date:today(),type:"Görev",note:""});setModal(true);}}/>
      {sorted.filter(c=>!c.done&&daysDiff(c.date)<0).map(c=>(
        <div key={c.id} style={{background:C.red+"10",border:`1px solid ${C.red}44`,borderRadius:11,padding:10,marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:700,color:C.red,fontSize:13}}>{c.title}</div><div style={{fontSize:10,color:C.muted}}>{fmtDate(c.date)} · {Math.abs(daysDiff(c.date))} gün gecikmiş</div></div>
          <button onClick={()=>updateProj(p=>({...p,calendar:(p.calendar||[]).map(x=>x.id===c.id?{...x,done:true}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"3px 8px",fontSize:11}}>✓</button>
        </div>
      ))}
      {sorted.filter(c=>!c.done&&daysDiff(c.date)>=0).length===0&&cal.length===0&&<Empty icon="📅" text="Takvim boş"/>}
      {sorted.filter(c=>!c.done&&daysDiff(c.date)>=0).map(c=>(
        <div key={c.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:11,marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:2}}><Badge color={typeC[c.type]||C.muted}>{c.type}</Badge><span style={{fontWeight:700,fontSize:13}}>{c.title}</span></div>
            <div style={{fontSize:11,color:C.muted}}>{fmtDate(c.date)} · {daysDiff(c.date)===0?"Bugün!":daysDiff(c.date)===1?"Yarın":`${daysDiff(c.date)} gün kaldı`}</div>
          </div>
          <button onClick={()=>updateProj(p=>({...p,calendar:(p.calendar||[]).map(x=>x.id===c.id?{...x,done:true}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"4px 9px",fontSize:11}}>✓</button>
        </div>
      ))}
      {modal&&(
        <Modal title="Takvim Ekle" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Field label="BAŞLIK"><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <Field label="TİP"><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{["Görev","Teslim","Toplantı","Ödeme","Diğer"].map(t=><option key={t}>{t}</option>)}</select></Field>
              <Field label="TARİH"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
            </div>
            <Btn full onClick={()=>{if(!form.title)return;updateProj(p=>({...p,calendar:[...(p.calendar||[]),{id:uid(),...form,done:false}]}));setModal(false);}}>Kaydet</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function HesapModule({proj}){
  const [tab,setTab]=useState("maliyet");
  const [region,setRegion]=useState(proj.region||"İstanbul");
  const [area,setArea]=useState("");
  const [quality,setQuality]=useState("Orta Kalite");
  const cur=proj.currency||"TRY";
  const factor=REGION_FACTOR[region]||1;
  const costs=COST_M2[quality];
  const minC=area&&costs?parseFloat(area)*costs.min*factor:0;
  const maxC=area&&costs?parseFloat(area)*costs.max*factor:0;
  return(
    <div className="fi">
      <div style={{display:"flex",gap:5,marginBottom:13,overflowX:"auto"}}>
        {[{key:"maliyet",label:"Maliyet"},{key:"piyasa",label:"Piyasa 2025"}].map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:C.card2,color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</button>
        ))}
      </div>
      {tab==="maliyet"&&(
        <div style={{display:"flex",flexDirection:"column",gap:11}}>
          <Field label="BÖLGE"><select value={region} onChange={e=>setRegion(e.target.value)}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></Field>
          <Field label="ALAN (m²)"><input type="number" placeholder="250" value={area} onChange={e=>setArea(e.target.value)}/></Field>
          <Field label="KALİTE"><select value={quality} onChange={e=>setQuality(e.target.value)}>{Object.keys(COST_M2).map(q=><option key={q}>{q}</option>)}</select></Field>
          {area&&(
            <div style={{background:C.card2,border:`1px solid ${C.green}44`,borderRadius:13,padding:14}}>
              <div style={{fontSize:9,color:C.green,fontWeight:800,letterSpacing:2,marginBottom:11}}>TAHMİNİ MALİYET</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}>
                <Stat label="MİNİMUM" value={fmt(minC,cur)} color={C.green}/>
                <Stat label="MAKSİMUM" value={fmt(maxC,cur)} color={C.orange}/>
                <Stat label="ORTALAMA" value={fmt((minC+maxC)/2,cur)} color={C.accent}/>
                <Stat label="BÖLGE ÇARPANI" value={`×${factor}`} color={C.a2}/>
              </div>
            </div>
          )}
        </div>
      )}
      {tab==="piyasa"&&(
        <div>
          {Object.entries(PRICES_2025).map(([name,data])=>(
            <div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{fontWeight:600,fontSize:12}}>{name}</div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(data.price,cur)}</div>
                <div style={{fontSize:9,color:C.muted}}>/{data.unit}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectScreen({proj,updateProj,onBack}){
  const [tab,setTab]=useState("ozet");
  const cur=proj.currency||"TRY";
  const spent=(proj.expenses||[]).reduce((s,e)=>s+e.amount,0);
  const pct=proj.budget?(spent/proj.budget)*100:0;
  const phIdx=PHASES.indexOf(proj.phase||"Temel");
  const prog=Math.round(((phIdx+(proj.phaseProgress||0)/100)/PHASES.length)*100);
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg}}>
      <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"44px 14px 0",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}>
          <button onClick={onBack} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",fontSize:15}}>←</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:8,color:C.accent,letterSpacing:3,fontWeight:700}}>AKTİF PROJE</div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:19,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{proj.name}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:C.accent,lineHeight:1}}>%{prog}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}>
          <div style={{background:C.card2,borderRadius:7,padding:"5px 7px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>Harcanan</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,color:pct>90?C.red:C.text}}>{fmt(spent,cur)}</div></div>
          <div style={{background:C.card2,borderRadius:7,padding:"5px 7px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>Kalan</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,color:(proj.budget||0)-spent<0?C.red:C.green}}>{fmt((proj.budget||0)-spent,cur)}</div></div>
          <div style={{background:C.card2,borderRadius:7,padding:"5px 7px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>Aşama</div><div style={{fontSize:9,fontWeight:700,color:C.accent,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{proj.phase||"Temel"}</div></div>
        </div>
        <div style={{display:"flex",gap:2,overflowX:"auto",paddingBottom:1,scrollbarWidth:"none"}}>
          {PROJ_TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:"transparent",color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:"transparent"}`,borderRadius:"8px 8px 0 0",padding:"6px 11px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",borderBottom:"none"}}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"13px 13px 80px"}}>
        {tab==="ozet"&&<OzetModule proj={proj} updateProj={updateProj}/>}
        {tab==="harcama"&&<HarcamaModule proj={proj} updateProj={updateProj}/>}
        {tab==="asama"&&<AsamaModule proj={proj} updateProj={updateProj}/>}
        {tab==="takvim"&&<TakvimModule proj={proj} updateProj={updateProj}/>}
        {tab==="hesap"&&<HesapModule proj={proj} updateProj={updateProj}/>}
        {(tab==="finans"||tab==="personel"||tab==="malzeme"||tab==="kalite"||tab==="yonetim"||tab==="notlar")&&(
          <Empty icon="🔧" text="Bu modül yakında eklenecek"/>
        )}
      </div>
    </div>
  );
}

export default function App(){
  const {projects,loading,save,remove}=useFirebase();
  const [screen,setScreen]=useState("home");
  const [activeId,setActiveId]=useState(null);
  const proj=projects.find(p=>p.id===activeId);
  const updateProj=useCallback(async(fn)=>{
    if(!proj)return;
    await save(fn(proj));
  },[proj,save]);
  if(loading)return <div style={{maxWidth:430,margin:"0 auto"}}><style>{CSS}</style><SplashScreen/></div>;
  return(
    <div style={{background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",overflowX:"hidden"}}>
      <style>{CSS}</style>
      {screen==="home"&&<HomeScreen projects={projects} onSelect={id=>{setActiveId(id);setScreen("project");}} onAdd={()=>setScreen("new")} onDelete={async id=>await remove(id)}/>}
      {screen==="new"&&<NewProjectScreen onBack={()=>setScreen("home")} onSave={async p=>{await save(p);setActiveId(p.id);setScreen("project");}}/>}
      {screen==="project"&&proj&&<ProjectScreen proj={proj} updateProj={updateProj} onBack={()=>{setScreen("home");setActiveId(null);}}/>}
    </div>
  );
}
