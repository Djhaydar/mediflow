import { T, avatarBg } from '../theme';
import Icon from './Icon';

export const Avatar = ({ initials='?', size=34 }) => {
  const bg = avatarBg(initials);
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`${bg}22`, border:`1.5px solid ${bg}55`, color:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.32, fontWeight:700, flexShrink:0, fontFamily:'Plus Jakarta Sans, sans-serif' }}>
      {initials}
    </div>
  );
};

const getStatusColors = () => ({
  'Programmé':             { bg:T.blueDim,  text:T.blue,  dot:T.blue  },
  'Confirmé':              { bg:T.tealDim,  text:T.teal,  dot:T.teal  },
  'Patient absent':        { bg:T.amberDim, text:T.amber, dot:T.amber },
  'Annulé':                { bg:T.redDim,   text:T.red,   dot:T.red   },
  'Consultation terminée': { bg:'rgba(100,116,139,0.12)', text:'#64748b', dot:'#64748b' },
  'Payé':                  { bg:T.tealDim,  text:T.teal,  dot:T.teal  },
  'Non payé':              { bg:T.amberDim, text:T.amber, dot:T.amber },
});
export const statusColor = (s) => getStatusColors()[s] || { bg:T.card, text:T.textSub, dot:T.textSub };

export const Badge = ({ status }) => {
  const s = statusColor(status);
  return (
    <span style={{ background:s.bg, color:s.text, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, display:'inline-flex', alignItems:'center', gap:5 }}>
      <span style={{ width:5, height:5, borderRadius:'50%', background:s.dot, display:'inline-block' }} />
      {status}
    </span>
  );
};

export const Card = ({ children, style={}, className='', onClick }) => (
  <div className={`hover-card ${className}`} onClick={onClick}
    style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:20, ...style }}>
    {children}
  </div>
);

export const Modal = ({ open, onClose, title, children, width=520 }) => {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:18, padding:28, width, maxWidth:'calc(100vw - 40px)', maxHeight:'calc(100vh - 60px)', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:16, color:T.text }}>{title}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.textMuted, padding:4, borderRadius:6, display:'flex' }}>
            <Icon name="close" size={16} color={T.textMuted} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ open, onClose, onConfirm, title, message, danger=false }) => (
  <Modal open={open} onClose={onClose} title={title} width={400}>
    <p style={{ fontSize:13, color:T.textSub, marginBottom:24, lineHeight:1.6 }}>{message}</p>
    <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
      <button className="btn-ghost" onClick={onClose}>Annuler</button>
      <button onClick={()=>{onConfirm();onClose();}} style={{ background:danger?T.red:T.teal, color:'#000', border:'none', borderRadius:8, padding:'8px 20px', cursor:'pointer', fontWeight:600, fontSize:13 }}>
        {danger?'Supprimer':'Confirmer'}
      </button>
    </div>
  </Modal>
);

export const Field = ({ label, children, style={} }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:6, ...style }}>
    {label&&<label style={{ fontSize:12, color:T.textSub, fontWeight:500 }}>{label}</label>}
    {children}
  </div>
);

export const Select = ({ value, onChange, options=[], placeholder, style={} }) => (
  <select className="input-base" value={value} onChange={e=>onChange(e.target.value)} style={style}>
    {placeholder&&<option value="">{placeholder}</option>}
    {options.map(o=>(
      <option key={typeof o==='string'?o:o.value} value={typeof o==='string'?o:o.value}>
        {typeof o==='string'?o:o.label}
      </option>
    ))}
  </select>
);

export const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display:'flex', gap:4, borderBottom:`1px solid ${T.border}`, marginBottom:20 }}>
    {tabs.map(t=>(
      <button key={t} onClick={()=>onChange(t)} style={{ background:'none', border:'none', cursor:'pointer', padding:'8px 16px', fontSize:13, fontWeight:active===t?600:400, color:active===t?T.teal:T.textSub, borderBottom:`2px solid ${active===t?T.teal:'transparent'}`, transition:'all 0.2s', marginBottom:-1 }}>{t}</button>
    ))}
  </div>
);

export const Empty = ({ icon='document', title, sub, action }) => (
  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:60, gap:12 }}>
    <div style={{ width:56, height:56, borderRadius:14, background:T.tealDim, border:`1px solid ${T.borderAccent}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Icon name={icon} size={24} color={T.teal} />
    </div>
    <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:15, color:T.text }}>{title}</div>
    {sub&&<div style={{ fontSize:12, color:T.textMuted, textAlign:'center', maxWidth:300 }}>{sub}</div>}
    {action}
  </div>
);

export const Toggle = ({ value, onChange, label, sub }) => (
  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10 }}>
    <div style={{ flex:1 }}>
      {label&&<div style={{ fontSize:13, fontWeight:600, color:T.text }}>{label}</div>}
      {sub&&<div style={{ fontSize:11, color:T.textMuted }}>{sub}</div>}
    </div>
    <div onClick={()=>onChange(!value)} style={{ width:44, height:24, borderRadius:12, background:value?T.teal:T.border, cursor:'pointer', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:value?22:3, transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.3)' }} />
    </div>
  </div>
);
