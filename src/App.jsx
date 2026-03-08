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
  TRY:{symbol:"₺",name:"Türk Lirası"},USD:{symbol:"$",name:"Dolar"},
  EUR:{symbol:"€",name:"Euro"},GBP:{symbol:"£",name:"Sterlin"},
  AED:{symbol:"د.إ",name:"Dirhem"},SAR:{symbol:"﷼",name:"Riyali"},
};
const fmt=(n,cur="TRY")=>{const sym=CURRENCIES[cur]?.symbol||"₺";const val=Math.abs(n||0);const str=val>=1000000?(val/1000000).toFixed(2)+"M":val>=1000?(val/1000).toFixed(1)+"K":val.toLocaleString("tr-TR");return(n<0?"-":"")+sym+str;};
const PHASES=["Temel","Kaba İnşaat","Çatı","Sıva","Elektrik","Tesisat","İç Mekan","Boya","Zemin","Teslim"];
const EXP_CATS=["Malzeme","İşçilik","Ekipman","Nakliye","Taşeron","Diğer"];
const REGIONS=["İstanbul","Ankara","İzmir","Bursa","Antalya","Adana","Konya","Diğer"];
const REGION_FACTOR={"İstanbul":1.25,"Ankara":1.10,"İzmir":1.15,"Bursa":1.05,"Antalya":1.08,"Adana":0.95,"Konya":0.92,"Diğer":1.0};
const COST_M2={"Kaba İnşaat":{min:7500,max:9500},"Orta Kalite":{min:12000,max:16000},"Yüksek Kalite":{min:18000,max:24000},"Lüks / Villa":{min:28000,max:45000}};
const PRICES_2025={"Demir (ton)":{price:28000,unit:"ton"},"Çimento (ton)":{price:3500,unit:"ton"},"Kum (m³)":{price:420,unit:"m³"},"Mıcır (m³)":{price:490,unit:"m³"},"Tuğla (adet)":{price:5.8,unit:"adet"},"Seramik (m²)":{price:380,unit:"m²"},"Boya (kg)":{price:110,unit:"kg"},"Çift Cam (m²)":{price:1100,unit:"m²"},"Kapı (adet)":{price:6500,unit:"adet"},"Parke (m²)":{price:520,unit:"m²"}};
const EQ_CHECKLIST=["Zemin etüd raporu alındı","Statik proje onaylandı","Kolon-kiriş detayları TBDY 2018'e uygun","Beton dayanımı min C25/30","Donatı yerleşimi projeye uygun","Beton dökümünde vibratör kullanıldı","Kalıp söküm sürelerine uyuldu","Perde duvarlar projeye göre yapıldı","Temel sistemi zemin raporuna uygun","Yapı denetim firması onayı alındı"];
const RISK_LEVELS=["Düşük","Orta","Yüksek","Kritik"];

const C={bg:"#0b0f18",card:"#131926",card2:"#1a2235",border:"#1e2d45",accent:"#c9952a",a2:"#3b82f6",green:"#10b981",red:"#ef4444",orange:"#f97316",purple:"#8b5cf6",cyan:"#06b6d4",text:"#e2ddd6",muted:"#64748b"};

const CSS=`
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
.su{animation:su .25s ease;}.fi{animation:fi .2s ease;}
.bar{transition:width .7s cubic-bezier(.4,0,.2,1);}
`;

const Badge=({children,color=C.accent})=>(<span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{children}</span>);
const Bar=({pct,color=C.accent,h=7})=>(<div style={{background:"#0a0e18",borderRadius:99,height:h,overflow:"hidden"}}><div className="bar" style={{width:`${Math.min(100,Math.max(0,pct||0))}%`,height:"100%",background:color,borderRadius:99}}/></div>);
const Stat=({label,value,color=C.text,sub})=>(<div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 12px",flex:1,minWidth:0}}><div style={{fontSize:8,color:C.muted,fontWeight:700,letterSpacing:1.5,marginBottom:3}}>{label}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:500,color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{value}</div>{sub&&<div style={{fontSize:9,color:C.muted,marginTop:2}}>{sub}</div>}</div>);
const Btn=({children,onClick,color=C.accent,outline,small,full,disabled,style:sx={}})=>(<button onClick={onClick} disabled={disabled} style={{background:outline?"transparent":color,color:outline?color:"#0b0f18",border:`1px solid ${color}`,borderRadius:10,padding:small?"5px 12px":"10px 18px",fontWeight:700,fontSize:small?11:14,width:full?"100%":"auto",opacity:disabled?.5:1,boxShadow:!outline?`0 2px 12px ${color}33`:"none",...sx}}>{children}</button>);
const Field=({label,children})=>(<div><div style={{fontSize:9,color:C.muted,fontWeight:700,marginBottom:4,letterSpacing:.5}}>{label}</div>{children}</div>);
const SHdr=({title,onAdd,addLabel="+ Ekle"})=>(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:11}}><div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800}}>{title}</div>{onAdd&&<Btn small onClick={onAdd}>{addLabel}</Btn>}</div>);
const Empty=({icon,text})=>(<div style={{textAlign:"center",padding:"32px 16px",color:C.muted}}><div style={{fontSize:32,marginBottom:7}}>{icon}</div><div style={{fontSize:13}}>{text}</div></div>);

function Modal({title,onClose,children}){
  return(<div style={{position:"fixed",inset:0,background:"#000a",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={onClose}><div className="su" onClick={e=>e.stopPropagation()} style={{background:C.card,borderRadius:"20px 20px 0 0",padding:20,width:"100%",maxWidth:430,maxHeight:"88vh",overflowY:"auto",border:`1px solid ${C.border}`,borderBottom:"none"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div style={{fontWeight:800,fontSize:16}}>{title}</div><button onClick={onClose} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:7,color:C.muted,padding:"3px 10px",fontSize:14}}>✕</button></div>{children}</div></div>);
}

function useFirebase(){
  const [projects,setProjects]=useState([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const s=document.createElement("script");
    s.type="module";
    s.textContent=`
      import{initializeApp}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
      import{getFirestore,collection,onSnapshot,setDoc,deleteDoc,doc}from"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
      const app=initializeApp(${JSON.stringify(FIREBASE_CONFIG)});
      const db=getFirestore(app);
      window.__db=db;window.__fns={collection,onSnapshot,setDoc,deleteDoc,doc};
      window.dispatchEvent(new Event("fb_ready"));
    `;
    document.head.appendChild(s);
    const onReady=()=>{
      const{collection,onSnapshot}=window.__fns;
      onSnapshot(collection(window.__db,"projects"),snap=>{
        setProjects(snap.docs.map(d=>({id:d.id,...d.data()})));
        setLoading(false);
      },()=>setLoading(false));
    };
    window.addEventListener("fb_ready",onReady);
    return()=>window.removeEventListener("fb_ready",onReady);
  },[]);
  const save=useCallback(async(proj)=>{if(!window.__fns)return;const{setDoc,doc}=window.__fns;await setDoc(doc(window.__db,"projects",proj.id),proj);},[]);
  const remove=useCallback(async(id)=>{if(!window.__fns)return;const{deleteDoc,doc}=window.__fns;await deleteDoc(doc(window.__db,"projects",id));},[]);
  return{projects,loading,save,remove};
}

function SplashScreen(){
  return(<div style={{background:C.bg,minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:9}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:48,color:C.accent,letterSpacing:5}}>AKINCI</div><div style={{fontSize:13,color:C.muted,letterSpacing:7}}>OS</div><div style={{marginTop:26,width:100,height:3,background:C.border,borderRadius:99,overflow:"hidden"}}><div style={{width:"55%",height:"100%",background:`linear-gradient(90deg,${C.accent},#f5c842)`,borderRadius:99}}/></div><div style={{fontSize:11,color:C.muted,marginTop:6,letterSpacing:2}}>Akıncı Yapı & Mühendislik</div><div style={{fontSize:11,color:C.muted,marginTop:4,opacity:.6}}>Yükleniyor...</div></div>);
}function HomeScreen({projects,onSelect,onAdd,onDelete}){
  const totalBudget=projects.reduce((s,p)=>s+(p.budget||0),0);
  const totalSpent=projects.reduce((s,p)=>s+(p.expenses||[]).reduce((x,e)=>x+e.amount,0),0);
  return(<div style={{background:C.bg,minHeight:"100vh"}}><div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"48px 16px 15px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:C.accent,letterSpacing:3,lineHeight:1}}>AKINCI</div><div style={{fontSize:10,color:C.muted,letterSpacing:5}}>OS · İnşaat Yönetim</div></div><button onClick={onAdd} style={{background:C.accent,color:"#0b0f18",borderRadius:12,width:42,height:42,fontSize:22,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 3px 16px ${C.accent}44`}}>+</button></div>{projects.length>0&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}><Stat label="TOPLAM BÜTÇE" value={fmt(totalBudget)} color={C.accent}/><Stat label="TOPLAM HARCAMA" value={fmt(totalSpent)} color={C.orange}/><Stat label="AKTİF PROJE" value={`${projects.length} proje`} color={C.a2}/><Stat label="TOPLAM KALAN" value={fmt(totalBudget-totalSpent)} color={C.green}/></div>)}</div><div style={{padding:"14px 14px 100px"}}>{projects.length===0?(<div style={{textAlign:"center",marginTop:80}}><div style={{fontSize:54,marginBottom:13}}>🏗️</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22,color:C.muted}}>Henüz proje yok</div><div style={{fontSize:13,color:C.muted,marginTop:6,opacity:.6}}>+ butonuna bas</div></div>):projects.map(proj=>{const spent=(proj.expenses||[]).reduce((s,e)=>s+e.amount,0);const pct=proj.budget?Math.min(100,(spent/proj.budget)*100):0;const phIdx=PHASES.indexOf(proj.phase||"Temel");const prog=Math.round(((phIdx+(proj.phaseProgress||0)/100)/PHASES.length)*100);const cur=proj.currency||"TRY";return(<div key={proj.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:15,marginBottom:10,cursor:"pointer"}} onClick={()=>onSelect(proj.id)}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:11}}><div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:18,marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{proj.name}</div>{proj.location&&<div style={{fontSize:11,color:C.muted}}>📍 {proj.location}</div>}</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:22,color:C.accent}}>%{prog}</div></div><Bar pct={prog} h={5}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginTop:9}}><div style={{background:C.card2,borderRadius:6,padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>BÜTÇE</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:600}}>{fmt(proj.budget,cur)}</div></div><div style={{background:C.card2,borderRadius:6,padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>HARCANAN</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:600,color:pct>90?C.red:C.text}}>{fmt(spent,cur)}</div></div><div style={{background:C.card2,borderRadius:6,padding:"4px 6px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>KALAN</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fontWeight:600,color:proj.budget-spent<0?C.red:C.green}}>{fmt(proj.budget-spent,cur)}</div></div></div><div style={{display:"flex",justifyContent:"flex-end",marginTop:9}}><button onClick={e=>{e.stopPropagation();if(confirm("Projeyi sil?"))onDelete(proj.id);}} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:7,color:C.red,padding:"4px 10px",fontSize:11}}>Sil</button></div></div>);})}</div></div>);
}

function NewProjectScreen({onSave,onBack}){
  const [form,setForm]=useState({name:"",location:"",budget:"",currency:"TRY",region:"İstanbul",startDate:today(),endDate:""});
  function save(){if(!form.name||!form.budget)return;const proj={id:uid(),...form,budget:parseFloat(form.budget),phase:"Temel",phaseProgress:0,expenses:[],notes:[],senets:[],calendar:[],credits:[],contractors:[],workers:[],puantaj:[],materials:[],orders:[],quotes:[],risks:[],accidents:[],insurances:[],meetings:[],tasks:[],issues:[],hakedisler:[],creditSales:[],earthquakeChecks:{},createdAt:today()};onSave(proj);}
  return(<div style={{background:C.bg,minHeight:"100vh",padding:"48px 16px 100px"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}><button onClick={onBack} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",fontSize:15}}>←</button><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:22}}>Yeni Proje</div></div><div style={{display:"flex",flexDirection:"column",gap:12}}><Field label="PROJE ADI *"><input placeholder="Kadıköy Konut Projesi" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field><Field label="KONUM"><input placeholder="İlçe, Şehir" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/></Field><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}><Field label="PARA BİRİMİ"><select value={form.currency} onChange={e=>setForm(f=>({...f,currency:e.target.value}))}>{Object.entries(CURRENCIES).map(([k,v])=><option key={k} value={k}>{v.symbol} {k}</option>)}</select></Field><Field label="BÖLGE"><select value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></Field></div><Field label="TOPLAM BÜTÇE *"><input type="number" placeholder="5000000" value={form.budget} onChange={e=>setForm(f=>({...f,budget:e.target.value}))}/></Field><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}><Field label="BAŞLANGIÇ"><input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))}/></Field><Field label="BİTİŞ"><input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))}/></Field></div><button onClick={save} style={{background:`linear-gradient(135deg,${C.accent},#f5c842)`,color:"#0b0f18",borderRadius:12,padding:"14px",fontWeight:900,fontSize:15,marginTop:6,boxShadow:`0 4px 20px ${C.accent}44`,fontFamily:"'Barlow',sans-serif",border:"none"}}>🏗️ Proje Oluştur</button></div></div>);
}

function OzetModule({proj}){
  const cur=proj.currency||"TRY";
  const spent=(proj.expenses||[]).reduce((s,e)=>s+e.amount,0);
  const pct=proj.budget?(spent/proj.budget)*100:0;
  const phIdx=PHASES.indexOf(proj.phase||"Temel");
  const prog=Math.round(((phIdx+(proj.phaseProgress||0)/100)/PHASES.length)*100);
  const overdue=(proj.senets||[]).filter(s=>s.status==="Bekliyor"&&daysDiff(s.dueDate)<0).length;
  const cats=EXP_CATS.map(cat=>({cat,total:(proj.expenses||[]).filter(e=>e.category===cat).reduce((s,e)=>s+e.amount,0)})).filter(c=>c.total>0);
  const colors=[C.accent,C.a2,C.green,C.purple,C.cyan,C.orange];
  return(<div className="fi" style={{display:"flex",flexDirection:"column",gap:11}}>{(overdue>0||pct>80)&&(<div style={{background:C.red+"15",border:`1px solid ${C.red}44`,borderRadius:12,padding:12}}><div style={{fontSize:9,color:C.red,fontWeight:800,letterSpacing:2,marginBottom:6}}>⚠️ UYARILAR</div>{overdue>0&&<div style={{fontSize:12,color:C.red,marginBottom:2}}>• {overdue} vadesi geçmiş çek/senet</div>}{pct>80&&<div style={{fontSize:12,color:C.orange}}>• Bütçenin %{pct.toFixed(0)}'i kullanıldı</div>}</div>)}<div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:15}}><div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:11}}>BÜTÇE DURUMU</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:11}}><Stat label="TOPLAM BÜTÇE" value={fmt(proj.budget,cur)}/><Stat label="HARCANAN" value={fmt(spent,cur)} color={pct>80?C.red:C.green}/><Stat label="KALAN" value={fmt((proj.budget||0)-spent,cur)} color={(proj.budget||0)-spent<0?C.red:C.a2}/><Stat label="KULLANIM" value={`%${pct.toFixed(1)}`} color={pct>90?C.red:C.orange}/></div><Bar pct={pct} color={pct>90?C.red:C.a2}/></div><div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:15}}><div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:9}}>İNŞAAT İLERLEMESİ</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:42,lineHeight:1,color:C.accent}}>%{prog}</div><div style={{textAlign:"right"}}><div style={{fontWeight:700,color:C.green,fontSize:14}}>{proj.phase||"Temel"}</div>{proj.endDate&&<div style={{fontSize:10,color:daysDiff(proj.endDate)<0?C.red:C.muted,marginTop:3}}>{daysDiff(proj.endDate)<0?`${Math.abs(daysDiff(proj.endDate))} gün gecikti`:`${daysDiff(proj.endDate)} gün kaldı`}</div>}</div></div><Bar pct={prog} h={9}/></div>{cats.length>0&&(<div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:15}}><div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:11}}>KATEGORİ DAĞILIMI</div>{cats.map((c,i)=>(<div key={c.cat} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{fontWeight:600}}>{c.cat}</span><span style={{fontFamily:"'JetBrains Mono',monospace",color:colors[i%6]}}>{fmt(c.total,cur)}</span></div><Bar pct={(c.total/spent)*100} color={colors[i%6]} h={5}/></div>))}</div>)}</div>);
}

function HarcamaModule({proj,updateProj}){
  const [showAdd,setShowAdd]=useState(false);
  const [filter,setFilter]=useState("Tümü");
  const [form,setForm]=useState({title:"",amount:"",category:"Malzeme",date:today(),faturali:false,kdv:"20",note:""});
  const cur=proj.currency||"TRY";
  const expenses=proj.expenses||[];
  const filtered=filter==="Tümü"?expenses:filter==="Faturalı"?expenses.filter(e=>e.faturali):filter==="Faturasız"?expenses.filter(e=>!e.faturali):expenses.filter(e=>e.category===filter);
  const total=filtered.reduce((s,e)=>s+(e.total||e.amount),0);
  function add(){if(!form.title||!form.amount)return;const net=parseFloat(form.amount);const kdvAmt=form.faturali?net*(parseFloat(form.kdv)/100):0;updateProj(p=>({...p,expenses:[...(p.expenses||[]),{id:uid(),...form,amount:net,kdvAmount:kdvAmt,total:net+kdvAmt}]}));setForm({title:"",amount:"",category:"Malzeme",date:today(),faturali:false,kdv:"20",note:""});setShowAdd(false);}
  return(<div className="fi"><div style={{display:"flex",gap:5,marginBottom:11,overflowX:"auto",paddingBottom:3}}>{["Tümü","Faturalı","Faturasız",...EXP_CATS].map(f=>(<button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?C.accent:C.card2,color:filter===f?"#0b0f18":C.muted,border:`1px solid ${filter===f?C.accent:C.border}`,borderRadius:20,padding:"5px 11px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{f}</button>))}</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontFamily:"'JetBrains Mono',monospace",color:C.accent,fontWeight:700,fontSize:14}}>{fmt(total,cur)}</div><Btn small onClick={()=>setShowAdd(true)}>+ Harcama Ekle</Btn></div>{filtered.length===0?<Empty icon="💸" text="Harcama yok"/>:[...filtered].reverse().map(exp=>(<div key={exp.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1,minWidth:0}}><div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:13}}>{exp.title}</span><Badge color={exp.faturali?C.green:C.orange}>{exp.faturali?"Faturalı":"Faturasız"}</Badge></div><div style={{fontSize:11,color:C.muted}}>{exp.category} · {fmtDate(exp.date)}</div>{exp.faturali&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>KDV %{exp.kdv}: {fmt(exp.kdvAmount,cur)}</div>}</div><div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent,fontSize:13}}>{fmt(exp.amount,cur)}</div><button onClick={()=>updateProj(p=>({...p,expenses:(p.expenses||[]).filter(e=>e.id!==exp.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button></div></div>))}{showAdd&&(<Modal title="Harcama Ekle" onClose={()=>setShowAdd(false)}><div style={{display:"flex",flexDirection:"column",gap:10}}><Field label="AÇIKLAMA *"><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field><Field label="TUTAR *"><input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></Field><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Field label="KATEGORİ"><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{EXP_CATS.map(c=><option key={c}>{c}</option>)}</select></Field><Field label="TARİH"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field></div><div style={{display:"flex",alignItems:"center",gap:10,background:C.card2,borderRadius:10,padding:10}}><input type="checkbox" checked={form.faturali} onChange={e=>setForm(f=>({...f,faturali:e.target.checked}))} style={{width:16,height:16}}/><span style={{fontWeight:700,fontSize:13}}>Faturalı Ödeme</span></div>{form.faturali&&<Field label="KDV ORANI (%)"><select value={form.kdv} onChange={e=>setForm(f=>({...f,kdv:e.target.value}))}>{["1","8","10","18","20"].map(r=><option key={r}>{r}</option>)}</select></Field>}<Btn full onClick={add}>Kaydet</Btn></div></Modal>)}</div>);
}

function FinansModule({proj,updateProj}){
  const [tab,setTab]=useState("senet");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const cur=proj.currency||"TRY";
  const senets=proj.senets||[];
  const credits=proj.credits||[];
  const hakedisler=proj.hakedisler||[];

  function addSenet(){
    if(!form.title||!form.amount||!form.dueDate)return;
    updateProj(p=>({...p,senets:[...(p.senets||[]),{id:uid(),...form,amount:parseFloat(form.amount),status:"Bekliyor",createdAt:today()}]}));
    setModal(null);setForm({});
  }
  function addCredit(){
    if(!form.bank||!form.amount)return;
    updateProj(p=>({...p,credits:[...(p.credits||[]),{id:uid(),...form,amount:parseFloat(form.amount),remaining:parseFloat(form.amount),createdAt:today()}]}));
    setModal(null);setForm({});
  }
  function addHakedis(){
    if(!form.contractor||!form.amount)return;
    updateProj(p=>({...p,hakedisler:[...(p.hakedisler||[]),{id:uid(),...form,amount:parseFloat(form.amount),status:"Bekliyor",createdAt:today()}]}));
    setModal(null);setForm({});
  }

  const tabs=[{key:"senet",label:"Çek/Senet"},{key:"kredi",label:"Kredi"},{key:"hakedis",label:"Hakediş"}];
  return(<div className="fi">
    <div style={{display:"flex",gap:5,marginBottom:13,overflowX:"auto"}}>
      {tabs.map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:C.card2,color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</button>))}
    </div>

    {tab==="senet"&&(<div>
      <SHdr title="ÇEK / SENET" onAdd={()=>{setForm({title:"",amount:"",dueDate:"",type:"Çek",bank:""});setModal("senet");}}/>
      {senets.length===0?<Empty icon="🏦" text="Çek/Senet yok"/>:senets.map(s=>{
        const diff=daysDiff(s.dueDate);
        const isOverdue=s.status==="Bekliyor"&&diff<0;
        return(<div key={s.id} style={{background:C.card2,border:`1px solid ${isOverdue?C.red:C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div><div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{s.title}</div>
            <div style={{fontSize:11,color:C.muted}}>{s.type} · {s.bank} · Vade: {fmtDate(s.dueDate)}</div>
            {isOverdue&&<div style={{fontSize:10,color:C.red,marginTop:2}}>⚠️ {Math.abs(diff)} gün gecikmiş</div>}
            {!isOverdue&&s.status==="Bekliyor"&&<div style={{fontSize:10,color:C.orange,marginTop:2}}>{diff} gün kaldı</div>}</div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(s.amount,cur)}</div>
              <Badge color={s.status==="Ödendi"?C.green:isOverdue?C.red:C.orange}>{s.status}</Badge>
              <div style={{display:"flex",gap:4}}>
                {s.status==="Bekliyor"&&<button onClick={()=>updateProj(p=>({...p,senets:(p.senets||[]).map(x=>x.id===s.id?{...x,status:"Ödendi"}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"2px 7px",fontSize:10}}>Ödendi</button>}
                <button onClick={()=>updateProj(p=>({...p,senets:(p.senets||[]).filter(x=>x.id!==s.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
              </div>
            </div>
          </div>
        </div>);
      })}
    </div>)}

    {tab==="kredi"&&(<div>
      <SHdr title="KREDİLER" onAdd={()=>{setForm({bank:"",amount:"",rate:"",term:"",startDate:today()});setModal("kredi");}}/>
      {credits.length===0?<Empty icon="💳" text="Kredi yok"/>:credits.map(c=>(<div key={c.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{c.bank}</div>
          <div style={{fontSize:11,color:C.muted}}>Faiz: %{c.rate} · {c.term} ay</div></div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(c.amount,cur)}</div>
            <div style={{fontSize:10,color:C.muted}}>Kalan: {fmt(c.remaining,cur)}</div>
            <button onClick={()=>updateProj(p=>({...p,credits:(p.credits||[]).filter(x=>x.id!==c.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10,marginTop:4}}>Sil</button>
          </div>
        </div>
      </div>))}
    </div>)}

    {tab==="hakedis"&&(<div>
      <SHdr title="HAKEDİŞLER" onAdd={()=>{setForm({contractor:"",amount:"",period:"",status:"Bekliyor"});setModal("hakedis");}}/>
      {hakedisler.length===0?<Empty icon="📄" text="Hakediş yok"/>:hakedisler.map(h=>(<div key={h.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:700,fontSize:13}}>{h.contractor}</div><div style={{fontSize:11,color:C.muted}}>{h.period}</div></div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(h.amount,cur)}</div>
            <Badge color={h.status==="Ödendi"?C.green:C.orange}>{h.status}</Badge>
            <div style={{display:"flex",gap:4}}>
              {h.status==="Bekliyor"&&<button onClick={()=>updateProj(p=>({...p,hakedisler:(p.hakedisler||[]).map(x=>x.id===h.id?{...x,status:"Ödendi"}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"2px 7px",fontSize:10}}>Ödendi</button>}
              <button onClick={()=>updateProj(p=>({...p,hakedisler:(p.hakedisler||[]).filter(x=>x.id!==h.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
            </div>
          </div>
        </div>
      </div>))}
    </div>)}

    {modal==="senet"&&(<Modal title="Çek/Senet Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="AÇIKLAMA *"><input value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
      <Field label="TUTAR *"><input type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Field label="TİP"><select value={form.type||"Çek"} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{["Çek","Senet","Havale"].map(t=><option key={t}>{t}</option>)}</select></Field>
        <Field label="VADESİ *"><input type="date" value={form.dueDate||""} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/></Field>
      </div>
      <Field label="BANKA/FİRMA"><input value={form.bank||""} onChange={e=>setForm(f=>({...f,bank:e.target.value}))}/></Field>
      <Btn full onClick={addSenet}>Kaydet</Btn>
    </div></Modal>)}

    {modal==="kredi"&&(<Modal title="Kredi Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="BANKA *"><input value={form.bank||""} onChange={e=>setForm(f=>({...f,bank:e.target.value}))}/></Field>
      <Field label="TUTAR *"><input type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Field label="FAİZ (%)"><input type="number" value={form.rate||""} onChange={e=>setForm(f=>({...f,rate:e.target.value}))}/></Field>
        <Field label="VADE (AY)"><input type="number" value={form.term||""} onChange={e=>setForm(f=>({...f,term:e.target.value}))}/></Field>
      </div>
      <Btn full onClick={addCredit}>Kaydet</Btn>
    </div></Modal>)}

    {modal==="hakedis"&&(<Modal title="Hakediş Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="TAŞERON/FİRMA *"><input value={form.contractor||""} onChange={e=>setForm(f=>({...f,contractor:e.target.value}))}/></Field>
      <Field label="TUTAR *"><input type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></Field>
      <Field label="DÖNEM"><input placeholder="Ocak 2025" value={form.period||""} onChange={e=>setForm(f=>({...f,period:e.target.value}))}/></Field>
      <Btn full onClick={addHakedis}>Kaydet</Btn>
    </div></Modal>)}
  </div>);
}

function PersonelModule({proj,updateProj}){
  const [tab,setTab]=useState("taseron");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const cur=proj.currency||"TRY";
  const contractors=proj.contractors||[];
  const workers=proj.workers||[];
  const puantaj=proj.puantaj||[];

  return(<div className="fi">
    <div style={{display:"flex",gap:5,marginBottom:13,overflowX:"auto"}}>
      {[{key:"taseron",label:"Taşeronlar"},{key:"isci",label:"İşçiler"},{key:"puantaj",label:"Puantaj"}].map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:C.card2,color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</button>))}
    </div>

    {tab==="taseron"&&(<div>
      <SHdr title="TAŞERONLAR" onAdd={()=>{setForm({name:"",job:"",phone:"",amount:""});setModal("taseron");}}/>
      {contractors.length===0?<Empty icon="👷" text="Taşeron yok"/>:contractors.map(c=>(<div key={c.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontWeight:700,fontSize:13}}>{c.name}</div><div style={{fontSize:11,color:C.muted}}>{c.job}</div>{c.phone&&<div style={{fontSize:11,color:C.a2}}>📞 {c.phone}</div>}</div>
          <div style={{textAlign:"right"}}>
            {c.amount&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(parseFloat(c.amount),cur)}</div>}
            <button onClick={()=>updateProj(p=>({...p,contractors:(p.contractors||[]).filter(x=>x.id!==c.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10,marginTop:4}}>Sil</button>
          </div>
        </div>
      </div>))}
    </div>)}

    {tab==="isci"&&(<div>
      <SHdr title="İŞÇİLER" onAdd={()=>{setForm({name:"",job:"",dailyRate:"",startDate:today()});setModal("isci");}}/>
      {workers.length===0?<Empty icon="👨‍🔧" text="İşçi yok"/>:workers.map(w=>(<div key={w.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:700,fontSize:13}}>{w.name}</div><div style={{fontSize:11,color:C.muted}}>{w.job}</div></div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.accent}}>{fmt(parseFloat(w.dailyRate||0),cur)}/gün</div>
            <button onClick={()=>updateProj(p=>({...p,workers:(p.workers||[]).filter(x=>x.id!==w.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10,marginTop:4}}>Sil</button>
          </div>
        </div>
      </div>))}
    </div>)}

    {tab==="puantaj"&&(<div>
      <SHdr title="PUANTAJ" onAdd={()=>{setForm({worker:"",date:today(),hours:"8",note:""});setModal("puantaj");}}/>
      {puantaj.length===0?<Empty icon="📋" text="Puantaj yok"/>:[...puantaj].reverse().slice(0,30).map(p=>(<div key={p.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:10,marginBottom:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontWeight:700,fontSize:12}}>{p.worker}</div><div style={{fontSize:10,color:C.muted}}>{fmtDate(p.date)}</div></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <Badge color={C.a2}>{p.hours} saat</Badge>
          <button onClick={()=>updateProj(pr=>({...pr,puantaj:(pr.puantaj||[]).filter(x=>x.id!==p.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
        </div>
      </div>))}
    </div>)}

    {modal==="taseron"&&(<Modal title="Taşeron Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="AD SOYAD *"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
      <Field label="İŞ TANIMI"><input value={form.job||""} onChange={e=>setForm(f=>({...f,job:e.target.value}))}/></Field>
      <Field label="TELEFON"><input value={form.phone||""} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></Field>
      <Field label="SÖZLEŞME TUTARI"><input type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.name)return;updateProj(p=>({...p,contractors:[...(p.contractors||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}

    {modal==="isci"&&(<Modal title="İşçi Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="AD SOYAD *"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
      <Field label="MESLEK"><input value={form.job||""} onChange={e=>setForm(f=>({...f,job:e.target.value}))}/></Field>
      <Field label="GÜNLÜK ÜCRET"><input type="number" value={form.dailyRate||""} onChange={e=>setForm(f=>({...f,dailyRate:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.name)return;updateProj(p=>({...p,workers:[...(p.workers||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}

    {modal==="puantaj"&&(<Modal title="Puantaj Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="İŞÇİ ADI *"><input value={form.worker||""} onChange={e=>setForm(f=>({...f,worker:e.target.value}))}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Field label="TARİH"><input type="date" value={form.date||today()} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
        <Field label="SAAT"><input type="number" value={form.hours||"8"} onChange={e=>setForm(f=>({...f,hours:e.target.value}))}/></Field>
      </div>
      <Btn full onClick={()=>{if(!form.worker)return;updateProj(p=>({...p,puantaj:[...(p.puantaj||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}
  </div>);
}

function MalzemeModule({proj,updateProj}){
  const [tab,setTab]=useState("stok");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const cur=proj.currency||"TRY";
  const materials=proj.materials||[];
  const orders=proj.orders||[];

  return(<div className="fi">
    <div style={{display:"flex",gap:5,marginBottom:13,overflowX:"auto"}}>
      {[{key:"stok",label:"Stok"},{key:"siparis",label:"Siparişler"}].map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:C.card2,color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</button>))}
    </div>

    {tab==="stok"&&(<div>
      <SHdr title="MALZEME STOKU" onAdd={()=>{setForm({name:"",quantity:"",unit:"adet",minStock:"",note:""});setModal("stok");}}/>
      {materials.length===0?<Empty icon="📦" text="Stok yok"/>:materials.map(m=>{
        const low=m.minStock&&parseFloat(m.quantity)<parseFloat(m.minStock);
        return(<div key={m.id} style={{background:C.card2,border:`1px solid ${low?C.red:C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,fontSize:13}}>{m.name}</div>{low&&<div style={{fontSize:10,color:C.red}}>⚠️ Stok kritik seviyede</div>}</div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Badge color={low?C.red:C.green}>{m.quantity} {m.unit}</Badge>
              <button onClick={()=>updateProj(p=>({...p,materials:(p.materials||[]).filter(x=>x.id!==m.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
            </div>
          </div>
        </div>);
      })}
    </div>)}

    {tab==="siparis"&&(<div>
      <SHdr title="SİPARİŞLER" onAdd={()=>{setForm({item:"",supplier:"",amount:"",orderDate:today(),deliveryDate:"",status:"Bekliyor"});setModal("siparis");}}/>
      {orders.length===0?<Empty icon="🚚" text="Sipariş yok"/>:orders.map(o=>(<div key={o.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontWeight:700,fontSize:13}}>{o.item}</div><div style={{fontSize:11,color:C.muted}}>{o.supplier}</div>{o.deliveryDate&&<div style={{fontSize:10,color:C.muted}}>Teslimat: {fmtDate(o.deliveryDate)}</div>}</div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            {o.amount&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(parseFloat(o.amount),cur)}</div>}
            <Badge color={o.status==="Teslim Edildi"?C.green:o.status==="Yolda"?C.a2:C.orange}>{o.status}</Badge>
            <div style={{display:"flex",gap:4}}>
              {o.status!=="Teslim Edildi"&&<button onClick={()=>updateProj(p=>({...p,orders:(p.orders||[]).map(x=>x.id===o.id?{...x,status:"Teslim Edildi"}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"2px 7px",fontSize:10}}>Teslim</button>}
              <button onClick={()=>updateProj(p=>({...p,orders:(p.orders||[]).filter(x=>x.id!==o.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
            </div>
          </div>
        </div>
      </div>))}
    </div>)}

    {modal==="stok"&&(<Modal title="Malzeme Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="MALZEME ADI *"><input value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Field label="MİKTAR *"><input type="number" value={form.quantity||""} onChange={e=>setForm(f=>({...f,quantity:e.target.value}))}/></Field>
        <Field label="BİRİM"><select value={form.unit||"adet"} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}>{["adet","kg","ton","m","m²","m³","lt"].map(u=><option key={u}>{u}</option>)}</select></Field>
      </div>
      <Field label="KRİTİK STOK SEVİYESİ"><input type="number" value={form.minStock||""} onChange={e=>setForm(f=>({...f,minStock:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.name||!form.quantity)return;updateProj(p=>({...p,materials:[...(p.materials||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}

    {modal==="siparis"&&(<Modal title="Sipariş Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="MALZEME/HİZMET *"><input value={form.item||""} onChange={e=>setForm(f=>({...f,item:e.target.value}))}/></Field>
      <Field label="TEDARİKÇİ"><input value={form.supplier||""} onChange={e=>setForm(f=>({...f,supplier:e.target.value}))}/></Field>
      <Field label="TUTAR"><input type="number" value={form.amount||""} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/></Field>
      <Field label="TAHMİNİ TESLİMAT"><input type="date" value={form.deliveryDate||""} onChange={e=>setForm(f=>({...f,deliveryDate:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.item)return;updateProj(p=>({...p,orders:[...(p.orders||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}
  </div>);
}function KaliteModule({proj,updateProj}){
  const [tab,setTab]=useState("deprem");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const risks=proj.risks||[];
  const accidents=proj.accidents||[];
  const checks=proj.earthquakeChecks||{};

  return(<div className="fi">
    <div style={{display:"flex",gap:5,marginBottom:13,overflowX:"auto"}}>
      {[{key:"deprem",label:"Deprem"},{key:"risk",label:"Risk"},{key:"kaza",label:"Kaza"}].map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:C.card2,color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</button>))}
    </div>

    {tab==="deprem"&&(<div>
      <div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:12,padding:13,marginBottom:11}}>
        <div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:3}}>TBDY 2018 KONTROLLERİ</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:11}}>{Object.values(checks).filter(Boolean).length}/{EQ_CHECKLIST.length} tamamlandı</div>
        <Bar pct={(Object.values(checks).filter(Boolean).length/EQ_CHECKLIST.length)*100} color={C.green}/>
      </div>
      {EQ_CHECKLIST.map((item,i)=>(<div key={i} onClick={()=>updateProj(p=>({...p,earthquakeChecks:{...(p.earthquakeChecks||{}),[i]:!checks[i]}}))} style={{background:checks[i]?C.green+"12":C.card2,border:`1px solid ${checks[i]?C.green+"44":C.border}`,borderRadius:10,padding:"11px 13px",marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:11}}>
        <div style={{width:22,height:22,borderRadius:"50%",background:checks[i]?C.green:C.card,border:`2px solid ${checks[i]?C.green:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{checks[i]?"✓":""}</div>
        <div style={{fontSize:12,fontWeight:checks[i]?700:400,color:checks[i]?C.green:C.text}}>{item}</div>
      </div>))}
    </div>)}

    {tab==="risk"&&(<div>
      <SHdr title="RİSK TAKİBİ" onAdd={()=>{setForm({title:"",level:"Orta",description:"",action:""});setModal("risk");}}/>
      {risks.length===0?<Empty icon="⚠️" text="Risk yok"/>:risks.map(r=>{
        const rc={Düşük:C.green,Orta:C.orange,Yüksek:C.red,Kritik:C.purple}[r.level]||C.muted;
        return(<div key={r.id} style={{background:C.card2,border:`1px solid ${rc}44`,borderRadius:11,padding:12,marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
            <div style={{fontWeight:700,fontSize:13}}>{r.title}</div>
            <div style={{display:"flex",gap:5,alignItems:"center"}}><Badge color={rc}>{r.level}</Badge><button onClick={()=>updateProj(p=>({...p,risks:(p.risks||[]).filter(x=>x.id!==r.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button></div>
          </div>
          {r.description&&<div style={{fontSize:11,color:C.muted,marginBottom:4}}>{r.description}</div>}
          {r.action&&<div style={{fontSize:11,color:C.a2}}>➤ {r.action}</div>}
        </div>);
      })}
    </div>)}

    {tab==="kaza"&&(<div>
      <SHdr title="KAZA KAYITLARI" onAdd={()=>{setForm({title:"",date:today(),injured:"",description:"",action:""});setModal("kaza");}}/>
      {accidents.length===0?<Empty icon="🚨" text="Kaza kaydı yok"/>:accidents.map(a=>(<div key={a.id} style={{background:C.card2,border:`1px solid ${C.red}44`,borderRadius:11,padding:12,marginBottom:7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontWeight:700,fontSize:13,color:C.red}}>{a.title}</div><div style={{fontSize:11,color:C.muted}}>{fmtDate(a.date)}</div>{a.injured&&<div style={{fontSize:11,color:C.orange,marginTop:2}}>Yaralı: {a.injured}</div>}</div>
          <button onClick={()=>updateProj(p=>({...p,accidents:(p.accidents||[]).filter(x=>x.id!==a.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
        </div>
        {a.description&&<div style={{fontSize:11,color:C.muted,marginTop:6}}>{a.description}</div>}
      </div>))}
    </div>)}

    {modal==="risk"&&(<Modal title="Risk Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="RİSK BAŞLIĞI *"><input value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
      <Field label="SEVİYE"><select value={form.level||"Orta"} onChange={e=>setForm(f=>({...f,level:e.target.value}))}>{RISK_LEVELS.map(r=><option key={r}>{r}</option>)}</select></Field>
      <Field label="AÇIKLAMA"><textarea rows={2} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></Field>
      <Field label="ÖNLEYİCİ EYLEM"><input value={form.action||""} onChange={e=>setForm(f=>({...f,action:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.title)return;updateProj(p=>({...p,risks:[...(p.risks||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}

    {modal==="kaza"&&(<Modal title="Kaza Kaydı" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="KAZA BAŞLIĞI *"><input value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
      <Field label="TARİH"><input type="date" value={form.date||today()} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
      <Field label="YARALI SAYISI/ADI"><input value={form.injured||""} onChange={e=>setForm(f=>({...f,injured:e.target.value}))}/></Field>
      <Field label="AÇIKLAMA"><textarea rows={2} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.title)return;updateProj(p=>({...p,accidents:[...(p.accidents||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}
  </div>);
}

function YonetimModule({proj,updateProj}){
  const [tab,setTab]=useState("gorev");
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({});
  const tasks=proj.tasks||[];
  const meetings=proj.meetings||[];
  const issues=proj.issues||[];

  return(<div className="fi">
    <div style={{display:"flex",gap:5,marginBottom:13,overflowX:"auto"}}>
      {[{key:"gorev",label:"Görevler"},{key:"toplanti",label:"Toplantılar"},{key:"sorun",label:"Sorunlar"}].map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:C.card2,color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</button>))}
    </div>

    {tab==="gorev"&&(<div>
      <SHdr title="GÖREVLER" onAdd={()=>{setForm({title:"",assignee:"",dueDate:"",priority:"Orta",status:"Bekliyor"});setModal("gorev");}}/>
      {tasks.length===0?<Empty icon="✅" text="Görev yok"/>:tasks.map(t=>{
        const pc={Düşük:C.green,Orta:C.orange,Yüksek:C.red}[t.priority]||C.muted;
        return(<div key={t.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}><div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:13,textDecoration:t.status==="Tamamlandı"?"line-through":"none",color:t.status==="Tamamlandı"?C.muted:C.text}}>{t.title}</span><Badge color={pc}>{t.priority}</Badge></div>
            {t.assignee&&<div style={{fontSize:11,color:C.muted}}>👤 {t.assignee}</div>}
            {t.dueDate&&<div style={{fontSize:10,color:daysDiff(t.dueDate)<0&&t.status!=="Tamamlandı"?C.red:C.muted}}>📅 {fmtDate(t.dueDate)}</div>}</div>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              {t.status!=="Tamamlandı"&&<button onClick={()=>updateProj(p=>({...p,tasks:(p.tasks||[]).map(x=>x.id===t.id?{...x,status:"Tamamlandı"}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"2px 7px",fontSize:10}}>✓</button>}
              <button onClick={()=>updateProj(p=>({...p,tasks:(p.tasks||[]).filter(x=>x.id!==t.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
            </div>
          </div>
        </div>);
      })}
    </div>)}

    {tab==="toplanti"&&(<div>
      <SHdr title="TOPLANTI NOTLARI" onAdd={()=>{setForm({title:"",date:today(),attendees:"",notes:""});setModal("toplanti");}}/>
      {meetings.length===0?<Empty icon="📝" text="Toplantı notu yok"/>:[...meetings].reverse().map(m=>(<div key={m.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
          <div><div style={{fontWeight:700,fontSize:13}}>{m.title}</div><div style={{fontSize:11,color:C.muted}}>{fmtDate(m.date)}</div>{m.attendees&&<div style={{fontSize:10,color:C.a2}}>👥 {m.attendees}</div>}</div>
          <button onClick={()=>updateProj(p=>({...p,meetings:(p.meetings||[]).filter(x=>x.id!==m.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
        </div>
        {m.notes&&<div style={{fontSize:12,color:C.text,background:C.card,borderRadius:8,padding:9,lineHeight:1.5}}>{m.notes}</div>}
      </div>))}
    </div>)}

    {tab==="sorun"&&(<div>
      <SHdr title="SORUN TAKİBİ" onAdd={()=>{setForm({title:"",priority:"Orta",description:"",status:"Açık"});setModal("sorun");}}/>
      {issues.length===0?<Empty icon="🔧" text="Sorun yok"/>:issues.map(i=>{
        const pc={Düşük:C.green,Orta:C.orange,Yüksek:C.red}[i.priority]||C.muted;
        return(<div key={i.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}><div style={{display:"flex",gap:5,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:13}}>{i.title}</span><Badge color={pc}>{i.priority}</Badge><Badge color={i.status==="Çözüldü"?C.green:C.orange}>{i.status}</Badge></div>
            {i.description&&<div style={{fontSize:11,color:C.muted}}>{i.description}</div>}</div>
            <div style={{display:"flex",gap:4,flexShrink:0}}>
              {i.status!=="Çözüldü"&&<button onClick={()=>updateProj(p=>({...p,issues:(p.issues||[]).map(x=>x.id===i.id?{...x,status:"Çözüldü"}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"2px 7px",fontSize:10}}>✓</button>}
              <button onClick={()=>updateProj(p=>({...p,issues:(p.issues||[]).filter(x=>x.id!==i.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
            </div>
          </div>
        </div>);
      })}
    </div>)}

    {modal==="gorev"&&(<Modal title="Görev Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="GÖREV *"><input value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
      <Field label="SORUMLU"><input value={form.assignee||""} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))}/></Field>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <Field label="ÖNCELİK"><select value={form.priority||"Orta"} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>{["Düşük","Orta","Yüksek"].map(p=><option key={p}>{p}</option>)}</select></Field>
        <Field label="SON TARİH"><input type="date" value={form.dueDate||""} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))}/></Field>
      </div>
      <Btn full onClick={()=>{if(!form.title)return;updateProj(p=>({...p,tasks:[...(p.tasks||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}

    {modal==="toplanti"&&(<Modal title="Toplantı Notu Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="BAŞLIK *"><input value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
      <Field label="TARİH"><input type="date" value={form.date||today()} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
      <Field label="KATILIMCILAR"><input value={form.attendees||""} onChange={e=>setForm(f=>({...f,attendees:e.target.value}))}/></Field>
      <Field label="NOTLAR"><textarea rows={4} value={form.notes||""} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.title)return;updateProj(p=>({...p,meetings:[...(p.meetings||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}

    {modal==="sorun"&&(<Modal title="Sorun Ekle" onClose={()=>setModal(null)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="SORUN *"><input value={form.title||""} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
      <Field label="ÖNCELİK"><select value={form.priority||"Orta"} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>{["Düşük","Orta","Yüksek"].map(p=><option key={p}>{p}</option>)}</select></Field>
      <Field label="AÇIKLAMA"><textarea rows={2} value={form.description||""} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.title)return;updateProj(p=>({...p,issues:[...(p.issues||[]),{id:uid(),...form}]}));setModal(null);setForm({});}}>Kaydet</Btn>
    </div></Modal>)}
  </div>);
}

function NotlarModule({proj,updateProj}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({title:"",note:"",date:today()});
  const notes=proj.notes||[];
  return(<div className="fi">
    <SHdr title="NOTLAR & FOTOĞRAFLAR" onAdd={()=>{setForm({title:"",note:"",date:today()});setModal(true);}}/>
    {notes.length===0?<Empty icon="📸" text="Not yok"/>:[...notes].reverse().map(n=>(<div key={n.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:12,marginBottom:7}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div><div style={{fontWeight:700,fontSize:13}}>{n.title}</div><div style={{fontSize:10,color:C.muted}}>{fmtDate(n.date)}</div></div>
        <button onClick={()=>updateProj(p=>({...p,notes:(p.notes||[]).filter(x=>x.id!==n.id)}))} style={{background:C.red+"22",border:`1px solid ${C.red}44`,borderRadius:6,color:C.red,padding:"2px 7px",fontSize:10}}>Sil</button>
      </div>
      {n.note&&<div style={{fontSize:12,color:C.text,lineHeight:1.6}}>{n.note}</div>}
    </div>))}
    {modal&&(<Modal title="Not Ekle" onClose={()=>setModal(false)}><div style={{display:"flex",flexDirection:"column",gap:10}}>
      <Field label="BAŞLIK *"><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field>
      <Field label="TARİH"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field>
      <Field label="NOT"><textarea rows={4} value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/></Field>
      <Btn full onClick={()=>{if(!form.title)return;updateProj(p=>({...p,notes:[...(p.notes||[]),{id:uid(),...form}]}));setModal(false);}}>Kaydet</Btn>
    </div></Modal>)}
  </div>);
}

function AsamaModule({proj,updateProj}){
  const phIdx=PHASES.indexOf(proj.phase||"Temel");
  const prog=Math.round(((phIdx+(proj.phaseProgress||0)/100)/PHASES.length)*100);
  return(<div className="fi"><div style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,padding:15,marginBottom:13}}><div style={{fontSize:9,color:C.accent,letterSpacing:3,fontWeight:800,marginBottom:9}}>AKTİF AŞAMA</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:40,color:C.accent,lineHeight:1}}>%{proj.phaseProgress||0}</div><div style={{fontWeight:700,color:C.green,fontSize:14}}>{proj.phase||"Temel"}</div></div><input type="range" min="0" max="100" value={proj.phaseProgress||0} onChange={e=>updateProj(p=>({...p,phaseProgress:parseInt(e.target.value)}))} style={{width:"100%",accentColor:C.accent,background:"transparent",border:"none",padding:0,marginBottom:4}}/><div style={{fontSize:9,color:C.muted,textAlign:"center"}}>Genel İlerleme: %{prog}</div></div>{PHASES.map((phase,idx)=>{const isDone=idx<phIdx,isActive=idx===phIdx;return(<div key={phase} onClick={()=>updateProj(p=>({...p,phase,phaseProgress:isActive?p.phaseProgress:0}))} style={{background:isActive?C.accent+"15":isDone?C.green+"08":C.card2,border:`1px solid ${isActive?C.accent:isDone?C.green+"44":C.border}`,borderRadius:12,padding:"12px 14px",marginBottom:6,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}><div style={{width:32,height:32,borderRadius:"50%",background:isDone?C.green:isActive?C.accent:C.card,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:isDone||isActive?"#0b0f18":C.muted,flexShrink:0}}>{isDone?"✓":idx+1}</div><div style={{flex:1}}><div style={{fontWeight:700,color:isActive?C.accent:isDone?C.green:C.text}}>{phase}</div><div style={{fontSize:10,color:C.muted}}>{isDone?"Tamamlandı":isActive?`Devam ediyor — %${proj.phaseProgress||0}`:"Bekliyor"}</div></div></div>);})}</div>);
}

function TakvimModule({proj,updateProj}){
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({title:"",date:today(),type:"Görev",note:""});
  const cal=proj.calendar||[];
  const sorted=[...cal].sort((a,b)=>a.date>b.date?1:-1);
  const typeC={"Görev":C.a2,"Teslim":C.red,"Toplantı":C.purple,"Ödeme":C.accent,"Diğer":C.muted};
  return(<div className="fi"><SHdr title="TAKVİM & TERMİN" onAdd={()=>{setForm({title:"",date:today(),type:"Görev",note:""});setModal(true);}}/>{sorted.filter(c=>!c.done&&daysDiff(c.date)<0).map(c=>(<div key={c.id} style={{background:C.red+"10",border:`1px solid ${C.red}44`,borderRadius:11,padding:10,marginBottom:5,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,color:C.red,fontSize:13}}>{c.title}</div><div style={{fontSize:10,color:C.muted}}>{fmtDate(c.date)} · {Math.abs(daysDiff(c.date))} gün gecikmiş</div></div><button onClick={()=>updateProj(p=>({...p,calendar:(p.calendar||[]).map(x=>x.id===c.id?{...x,done:true}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"3px 8px",fontSize:11}}>✓</button></div>))}{sorted.filter(c=>!c.done&&daysDiff(c.date)>=0).length===0&&cal.length===0&&<Empty icon="📅" text="Takvim boş"/>}{sorted.filter(c=>!c.done&&daysDiff(c.date)>=0).map(c=>(<div key={c.id} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:11,padding:11,marginBottom:7,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{display:"flex",gap:5,alignItems:"center",marginBottom:2}}><Badge color={typeC[c.type]||C.muted}>{c.type}</Badge><span style={{fontWeight:700,fontSize:13}}>{c.title}</span></div><div style={{fontSize:11,color:C.muted}}>{fmtDate(c.date)} · {daysDiff(c.date)===0?"Bugün!":daysDiff(c.date)===1?"Yarın":`${daysDiff(c.date)} gün kaldı`}</div></div><button onClick={()=>updateProj(p=>({...p,calendar:(p.calendar||[]).map(x=>x.id===c.id?{...x,done:true}:x)}))} style={{background:C.green+"22",border:`1px solid ${C.green}44`,borderRadius:6,color:C.green,padding:"4px 9px",fontSize:11}}>✓</button></div>))}{modal&&(<Modal title="Takvim Ekle" onClose={()=>setModal(false)}><div style={{display:"flex",flexDirection:"column",gap:10}}><Field label="BAŞLIK"><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></Field><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}><Field label="TİP"><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>{["Görev","Teslim","Toplantı","Ödeme","Diğer"].map(t=><option key={t}>{t}</option>)}</select></Field><Field label="TARİH"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></Field></div><Btn full onClick={()=>{if(!form.title)return;updateProj(p=>({...p,calendar:[...(p.calendar||[]),{id:uid(),...form,done:false}]}));setModal(false);}}>Kaydet</Btn></div></Modal>)}</div>);
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
  return(<div className="fi"><div style={{display:"flex",gap:5,marginBottom:13,overflowX:"auto"}}>{[{key:"maliyet",label:"Maliyet"},{key:"piyasa",label:"Piyasa 2025"}].map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:C.card2,color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:C.border}`,borderRadius:20,padding:"5px 12px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>{t.label}</button>))}</div>{tab==="maliyet"&&(<div style={{display:"flex",flexDirection:"column",gap:11}}><Field label="BÖLGE"><select value={region} onChange={e=>setRegion(e.target.value)}>{REGIONS.map(r=><option key={r}>{r}</option>)}</select></Field><Field label="ALAN (m²)"><input type="number" placeholder="250" value={area} onChange={e=>setArea(e.target.value)}/></Field><Field label="KALİTE"><select value={quality} onChange={e=>setQuality(e.target.value)}>{Object.keys(COST_M2).map(q=><option key={q}>{q}</option>)}</select></Field>{area&&(<div style={{background:C.card2,border:`1px solid ${C.green}44`,borderRadius:13,padding:14}}><div style={{fontSize:9,color:C.green,fontWeight:800,letterSpacing:2,marginBottom:11}}>TAHMİNİ MALİYET</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7}}><Stat label="MİNİMUM" value={fmt(minC,cur)} color={C.green}/><Stat label="MAKSİMUM" value={fmt(maxC,cur)} color={C.orange}/><Stat label="ORTALAMA" value={fmt((minC+maxC)/2,cur)} color={C.accent}/><Stat label="BÖLGE ÇARPANI" value={`×${factor}`} color={C.a2}/></div></div>)}</div>)}{tab==="piyasa"&&(<div>{Object.entries(PRICES_2025).map(([name,data])=>(<div key={name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}><div style={{fontWeight:600,fontSize:12}}>{name}</div><div style={{textAlign:"right"}}><div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,color:C.accent}}>{fmt(data.price,cur)}</div><div style={{fontSize:9,color:C.muted}}>/{data.unit}</div></div></div>))}</div>)}</div>);
}

const PROJ_TABS=[
  {key:"ozet",label:"📊 Özet"},{key:"harcama",label:"💸 Harcama"},
  {key:"finans",label:"🏦 Finans"},{key:"personel",label:"👷 Personel"},
  {key:"malzeme",label:"📦 Malzeme"},{key:"takvim",label:"📅 Takvim"},
  {key:"asama",label:"🔨 Aşama"},{key:"kalite",label:"🛡️ Kalite"},
  {key:"yonetim",label:"📋 Yönetim"},{key:"hesap",label:"🧮 Hesap"},
  {key:"notlar",label:"📸 Notlar"},
];

function ProjectScreen({proj,updateProj,onBack}){
  const [tab,setTab]=useState("ozet");
  const cur=proj.currency||"TRY";
  const spent=(proj.expenses||[]).reduce((s,e)=>s+e.amount,0);
  const pct=proj.budget?(spent/proj.budget)*100:0;
  const phIdx=PHASES.indexOf(proj.phase||"Temel");
  const prog=Math.round(((phIdx+(proj.phaseProgress||0)/100)/PHASES.length)*100);
  return(<div style={{display:"flex",flexDirection:"column",height:"100vh",background:C.bg}}><div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"44px 14px 0",flexShrink:0}}><div style={{display:"flex",alignItems:"center",gap:9,marginBottom:10}}><button onClick={onBack} style={{background:C.card2,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,padding:"7px 12px",fontSize:15}}>←</button><div style={{flex:1,minWidth:0}}><div style={{fontSize:8,color:C.accent,letterSpacing:3,fontWeight:700}}>AKTİF PROJE</div><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:800,fontSize:19,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{proj.name}</div></div><div style={{textAlign:"right"}}><div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:900,fontSize:28,color:C.accent,lineHeight:1}}>%{prog}</div></div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5,marginBottom:10}}><div style={{background:C.card2,borderRadius:7,padding:"5px 7px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>Harcanan</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,color:pct>90?C.red:C.text}}>{fmt(spent,cur)}</div></div><div style={{background:C.card2,borderRadius:7,padding:"5px 7px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>Kalan</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,color:(proj.budget||0)-spent<0?C.red:C.green}}>{fmt((proj.budget||0)-spent,cur)}</div></div><div style={{background:C.card2,borderRadius:7,padding:"5px 7px",textAlign:"center"}}><div style={{fontSize:7,color:C.muted}}>Aşama</div><div style={{fontSize:9,fontWeight:700,color:C.accent,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{proj.phase||"Temel"}</div></div></div><div style={{display:"flex",gap:2,overflowX:"auto",paddingBottom:1,scrollbarWidth:"none"}}>{PROJ_TABS.map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} style={{background:tab===t.key?C.accent:"transparent",color:tab===t.key?"#0b0f18":C.muted,border:`1px solid ${tab===t.key?C.accent:"transparent"}`,borderRadius:"8px 8px 0 0",padding:"6px 11px",fontSize:10,fontWeight:700,whiteSpace:"nowrap",borderBottom:"none"}}>{t.label}</button>))}</div></div><div style={{flex:1,overflowY:"auto",padding:"13px 13px 80px"}}>
    {tab==="ozet"&&<OzetModule proj={proj} updateProj={updateProj}/>}
    {tab==="harcama"&&<HarcamaModule proj={proj} updateProj={updateProj}/>}
    {tab==="finans"&&<FinansModule proj={proj} updateProj={updateProj}/>}
    {tab==="personel"&&<PersonelModule proj={proj} updateProj={updateProj}/>}
    {tab==="malzeme"&&<MalzemeModule proj={proj} updateProj={updateProj}/>}
    {tab==="takvim"&&<TakvimModule proj={proj} updateProj={updateProj}/>}
    {tab==="asama"&&<AsamaModule proj={proj} updateProj={updateProj}/>}
    {tab==="kalite"&&<KaliteModule proj={proj} updateProj={updateProj}/>}
    {tab==="yonetim"&&<YonetimModule proj={proj} updateProj={updateProj}/>}
    {tab==="hesap"&&<HesapModule proj={proj} updateProj={updateProj}/>}
    {tab==="notlar"&&<NotlarModule proj={proj} updateProj={updateProj}/>}
  </div></div>);
}

export default function App(){
  const {projects,loading,save,remove}=useFirebase();
  const [screen,setScreen]=useState("home");
  const [activeId,setActiveId]=useState(null);
  const proj=projects.find(p=>p.id===activeId);
  const updateProj=useCallback(async(fn)=>{if(!proj)return;await save(fn(proj));},[proj,save]);
  if(loading)return <div style={{maxWidth:430,margin:"0 auto"}}><style>{CSS}</style><SplashScreen/></div>;
  return(<div style={{background:C.bg,minHeight:"100vh",maxWidth:430,margin:"0 auto",overflowX:"hidden"}}><style>{CSS}</style>{screen==="home"&&<HomeScreen projects={projects} onSelect={id=>{setActiveId(id);setScreen("project");}} onAdd={()=>setScreen("new")} onDelete={async id=>await remove(id)}/>}{screen==="new"&&<NewProjectScreen onBack={()=>setScreen("home")} onSave={async p=>{await save(p);setActiveId(p.id);setScreen("project");}}/>}{screen==="project"&&proj&&<ProjectScreen proj={proj} updateProj={updateProj} onBack={()=>{setScreen("home");setActiveId(null);}}/>}</div>);
}
