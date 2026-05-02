import { useState, useEffect } from 'react';
import { T } from '../theme';
import Icon from './Icon';
import { useApp } from '../context/AppContext';

const Header = ({ page, onToggleSidebar, setPage }) => {
  const [time, setTime]   = useState(new Date());
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [showRes, setShowRes] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { getPatients, getRdv, getSettings, getTodayRdv, t, locale } = useApp();
  const settings = getSettings();

  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);

  useEffect(()=>{
    if(search.length<2){setResults([]);return;}
    const q=search.toLowerCase();
    const pats=getPatients().filter(p=>`${p.firstName} ${p.lastName}`.toLowerCase().includes(q)||p.phone?.includes(q)).slice(0,5).map(p=>({type:'patient',label:`${p.firstName} ${p.lastName}`,sub:`${p.age||''}ans · ${p.phone||''}`,id:p.id}));
    const rdvs=getRdv().filter(r=>r.patientName?.toLowerCase().includes(q)).slice(0,3).map(r=>({type:'rdv',label:r.patientName,sub:`RDV ${r.date} ${r.time}`}));
    setResults([...pats,...rdvs]);
  },[search]);

  const todayRdv=getTodayRdv().filter(r=>r.statut==='Programmé'||r.statut==='Confirmé');
  const now=new Date();
  const upcomingRdv=todayRdv.filter(r=>{const[h,m]=r.time.split(':').map(Number);const t=new Date();t.setHours(h,m,0);return(t-now)/60000>0&&(t-now)/60000<=30;});

  return (
    <header style={{ height:60, background:T.surface, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', padding:'0 20px', gap:16, flexShrink:0, position:'relative', zIndex:100 }}>
      <button onClick={onToggleSidebar} style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:6, display:'flex' }}>
        <Icon name="menu" size={18} color={T.textSub} />
      </button>

      <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:16, color:T.text, minWidth:140 }}>
        {settings.cabinetName||'MédiFlow'}
      </div>

      <div style={{ flex:1, maxWidth:420, position:'relative' }}>
        <Icon name="search" size={14} color={T.textMuted} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
        <input className="input-base" value={search} onChange={e=>{setSearch(e.target.value);setShowRes(true);}} onFocus={()=>setShowRes(true)} onBlur={()=>setTimeout(()=>setShowRes(false),200)} placeholder={t('search.placeholder')} style={{ paddingLeft:34 }} />
        {showRes&&results.length>0&&(
          <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:4, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', overflow:'hidden', zIndex:999 }}>
            {results.map((r,i)=>(
              <div key={i} onMouseDown={()=>{setSearch('');setShowRes(false);setPage(r.type==='patient'?'patients':'calendar');}} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:`1px solid ${T.border}` }} className="hover-card">
                <div style={{ width:28, height:28, borderRadius:7, background:r.type==='patient'?T.blueDim:T.tealDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name={r.type==='patient'?'patients':'calendar'} size={12} color={r.type==='patient'?T.blue:T.teal} />
                </div>
                <div><div style={{ fontSize:13, fontWeight:600, color:T.text }}>{r.label}</div><div style={{ fontSize:11, color:T.textMuted }}>{r.sub}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex:1 }} />

      <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:1 }}>
        <div style={{ fontFamily:'Syne, sans-serif', fontSize:14, fontWeight:700, color:T.teal, letterSpacing:'0.05em' }}>
          {time.toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
        </div>
        <div style={{ fontSize:10, color:T.textMuted, textTransform:'capitalize' }}>
          {time.toLocaleDateString(locale,{weekday:'long',day:'numeric',month:'long'})}
        </div>
      </div>

      <div style={{ position:'relative' }}>
        <button onClick={()=>setNotifOpen(o=>!o)} style={{ background:'none', border:'none', cursor:'pointer', padding:6, borderRadius:8, position:'relative', display:'flex' }}>
          <Icon name="bell" size={18} color={upcomingRdv.length>0?T.amber:T.textSub} />
          {upcomingRdv.length>0&&<span style={{ position:'absolute', top:3, right:3, width:8, height:8, background:T.amber, borderRadius:'50%', border:`2px solid ${T.surface}` }} />}
        </button>
        {notifOpen&&(
          <div style={{ position:'absolute', top:'100%', right:0, marginTop:4, background:T.surface, border:`1px solid ${T.border}`, borderRadius:12, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', width:290, zIndex:999, overflow:'hidden' }}>
            <div style={{ padding:'12px 16px', borderBottom:`1px solid ${T.border}`, fontWeight:700, fontSize:13, color:T.text }}>Notifications</div>
            {upcomingRdv.length===0
              ?<div style={{ padding:'20px 16px', fontSize:12, color:T.textMuted, textAlign:'center' }}>Aucun RDV imminent</div>
              :upcomingRdv.map((r,i)=>(
                <div key={i} style={{ padding:'10px 16px', borderBottom:`1px solid ${T.border}`, display:'flex', gap:10, alignItems:'center' }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:T.amberDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon name="clock" size={14} color={T.amber} />
                  </div>
                  <div><div style={{ fontSize:12, fontWeight:600, color:T.text }}>{r.patientName}</div><div style={{ fontSize:11, color:T.amber }}>RDV à {r.time}</div></div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
