import { T } from '../theme';
import Icon from './Icon';
import { useApp } from '../context/AppContext';

const NAV_IDS = [
  { id:'dashboard',    icon:'dashboard'    },
  { id:'calendar',     icon:'calendar'     },
  { id:'patients',     icon:'patients'     },
  { id:'consultation', icon:'stethoscope'  },
  { id:'papier',       icon:'prescription' },
  { id:'medications',  icon:'medications'  },
  { id:'finance',      icon:'finance'      },
];

const Sidebar = ({ page, setPage, collapsed }) => {
  const { getSettings, t } = useApp();
  const s = getSettings();

  return (
    <aside style={{ width:collapsed?64:220, background:T.surface, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', padding:'16px 0', gap:2, transition:'width 0.3s cubic-bezier(.16,1,.3,1)', overflow:'hidden', flexShrink:0 }}>
      <div style={{ padding:'8px 16px 20px', display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
        <div style={{ width:34, height:34, borderRadius:10, flexShrink:0, background:`linear-gradient(135deg,${T.teal},${T.blue})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 4px 16px ${T.tealDim}` }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><rect x="11" y="7" width="2" height="10" fill="rgba(0,0,0,0.4)"/><rect x="7" y="11" width="10" height="2" fill="rgba(0,0,0,0.4)"/></svg>
        </div>
        {!collapsed&&(
          <div style={{ overflow:'hidden' }}>
            <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:15, color:T.text, whiteSpace:'nowrap' }}>MédiFlow</div>
            <div style={{ fontSize:10, color:T.textMuted, whiteSpace:'nowrap' }}>{s.cabinetName||t('sidebar.cabinet')}</div>
          </div>
        )}
      </div>

      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:2, padding:'0 8px' }}>
        {NAV_IDS.map(n=>{
          const active=page===n.id;
          return (
            <div key={n.id} onClick={()=>setPage(n.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, background:active?T.tealDim:'transparent', border:`1px solid ${active?T.borderAccent:'transparent'}`, color:active?T.teal:T.textSub, overflow:'hidden', whiteSpace:'nowrap', cursor:'pointer' }}>
              <Icon name={n.icon} size={17} color={active?T.teal:T.textSub} style={{flexShrink:0}} />
              {!collapsed&&<span style={{ fontSize:13, fontWeight:active?600:400, fontFamily:'Plus Jakarta Sans, sans-serif' }}>{t(`nav.${n.id}`)}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ padding:'0 8px', display:'flex', flexDirection:'column', gap:2 }}>
        <div onClick={()=>setPage('settings')} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10, background:page==='settings'?T.tealDim:'transparent', border:`1px solid ${page==='settings'?T.borderAccent:'transparent'}`, color:page==='settings'?T.teal:T.textMuted, cursor:'pointer', overflow:'hidden' }}>
          <Icon name="settings" size={17} color={page==='settings'?T.teal:T.textMuted} style={{flexShrink:0}} />
          {!collapsed&&<span style={{ fontSize:13, color:page==='settings'?T.teal:T.textMuted }}>{t('nav.settings')}</span>}
        </div>
        <div style={{ margin:'8px 2px 0', padding:'10px 8px', borderRadius:10, background:T.tealDim, border:`1px solid ${T.borderAccent}`, display:'flex', alignItems:'center', gap:8, overflow:'hidden' }}>
          <div style={{ width:30, height:30, borderRadius:'50%', background:`${T.teal}22`, border:`1.5px solid ${T.teal}55`, color:T.teal, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, flexShrink:0 }}>{s.doctorInitials||'DR'}</div>
          {!collapsed&&(
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.text, whiteSpace:'nowrap' }}>{s.doctorName||t('sidebar.doctor')}</div>
              <div style={{ fontSize:10, color:T.teal, whiteSpace:'nowrap' }}>{s.specialty||t('sidebar.doctor')}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
