import { useState, useMemo } from 'react';
import { T } from '../theme';
import Icon from '../components/Icon';
import { Card, Badge, Modal, Field, Select, ConfirmDialog, Empty } from '../components/UI';
import { useApp } from '../context/AppContext';
import { toDateStr, RDV_STATUTS } from '../db/database';

const HOURS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const STATUS_COLOR = { 'Programmé':T.blue,'Confirmé':T.teal,'Patient absent':T.amber,'Annulé':T.red,'Consultation terminée':'#64748b' };

const RdvModal = ({ open, onClose, onSave, rdv=null, defaultDate='' }) => {
  const { getPatients } = useApp();
  const patients = getPatients();
  const blank = { patientId:'', patientName:'', date:defaultDate||toDateStr(), time:'09:00', motif:'', statut:'Programmé', duree:30, notes:'', pinned:false };
  const [form, setForm] = useState(rdv||blank);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // reset on open
  useState(()=>{ if(open) setForm(rdv ? {...blank,...rdv} : {...blank, date:defaultDate||toDateStr()}); },[open]);

  const handlePatient = (pid) => {
    if(!pid){set('patientId','');set('patientName','');return;}
    if(pid==='__new__'){set('patientId','__new__');return;}
    const p=patients.find(pt=>pt.id===Number(pid));
    if(p){set('patientId',p.id);set('patientName',`${p.firstName} ${p.lastName}`);}
  };

  const handleSave = () => {
    const name = form.patientId&&form.patientId!=='__new__' ? form.patientName : form.patientName;
    if(!form.date||!form.time||!name?.trim()) return;
    onSave({...form, patientName: name});
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={rdv?'Modifier le rendez-vous':'Nouveau rendez-vous'} width={500}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Patient">
          {patients.length>0&&(
            <select className="input-base" value={form.patientId||''} onChange={e=>handlePatient(e.target.value)}>
              <option value="">Sélectionner un patient…</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              <option value="__new__">+ Nom libre</option>
            </select>
          )}
          {(form.patientId==='__new__'||patients.length===0)&&(
            <input className="input-base" style={{marginTop:patients.length>0?6:0}} placeholder="Nom du patient" value={form.patientName} onChange={e=>set('patientName',e.target.value)} />
          )}
        </Field>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Date"><input type="date" className="input-base" value={form.date} onChange={e=>set('date',e.target.value)} /></Field>
          <Field label="Heure"><input type="time" className="input-base" value={form.time} onChange={e=>set('time',e.target.value)} /></Field>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Motif"><input className="input-base" placeholder="Consultation, suivi..." value={form.motif} onChange={e=>set('motif',e.target.value)} /></Field>
          <Field label="Durée (min)">
            <select className="input-base" value={form.duree} onChange={e=>set('duree',Number(e.target.value))}>
              {[15,20,30,45,60,90].map(d=><option key={d} value={d}>{d} min</option>)}
            </select>
          </Field>
        </div>

        <Field label="Statut"><Select value={form.statut} onChange={v=>set('statut',v)} options={RDV_STATUTS} /></Field>
        <Field label="Notes"><textarea className="input-base" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} style={{resize:'vertical'}} /></Field>

        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:form.pinned?T.amberDim:T.card, border:`1px solid ${form.pinned?T.amber+'44':T.border}`, borderRadius:10, cursor:'pointer' }}
          onClick={()=>set('pinned',!form.pinned)}>
          <span style={{ fontSize:18 }}>📌</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Épingler ce rendez-vous</div>
            <div style={{ fontSize:11, color:T.textMuted }}>Affichage prioritaire dans le tableau de bord</div>
          </div>
          <div style={{ width:36, height:20, borderRadius:10, background:form.pinned?T.amber:T.border, position:'relative', transition:'background 0.2s', flexShrink:0 }}>
            <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:form.pinned?18:3, transition:'left 0.2s' }} />
          </div>
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={handleSave}>{rdv?'Enregistrer':'Créer le RDV'}</button>
        </div>
      </div>
    </Modal>
  );
};

const RdvCard = ({ rdv, onEdit, onDelete, onStart }) => {
  const color = STATUS_COLOR[rdv.statut]||T.blue;
  return (
    <div style={{ background:`${color}18`, border:`1px solid ${color}44`, borderLeft:`3px solid ${color}`, borderRadius:6, padding:'4px 6px', marginBottom:2 }}>
      <div style={{ fontSize:10, fontWeight:600, color, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {rdv.pinned?'📌 ':''}{rdv.patientName}
      </div>
      <div style={{ fontSize:9, color:T.textMuted }}>{rdv.motif||rdv.time}</div>
      <div style={{ display:'flex', gap:3, marginTop:3 }}>
        <button onClick={e=>{e.stopPropagation();onEdit(rdv);}} style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:T.blueDim, color:T.blue, border:'none', cursor:'pointer' }}>✏️</button>
        {(rdv.statut==='Programmé'||rdv.statut==='Confirmé')&&(
          <button onClick={e=>{e.stopPropagation();onStart(rdv);}} style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:T.tealDim, color:T.teal, border:'none', cursor:'pointer' }}>▶ Débuter</button>
        )}
        <button onClick={e=>{e.stopPropagation();onDelete(rdv);}} style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:T.redDim, color:T.red, border:'none', cursor:'pointer' }}>✕</button>
      </div>
    </div>
  );
};

const CalendarPage = ({ setPage }) => {
  const { getRdv, addRdv, updateRdv, deleteRdv, ensurePatient } = useApp();
  const [view, setView] = useState('semaine');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modal, setModal] = useState(false);
  const [editRdv, setEditRdv] = useState(null);
  const [delTarget, setDelTarget] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const allRdv = getRdv();

  const weekDays = useMemo(()=>{
    const d=new Date(currentDate);const day=d.getDay();
    const mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:day-1));
    return Array.from({length:7},(_,i)=>{const dd=new Date(mon);dd.setDate(mon.getDate()+i);return{label:dd.toLocaleDateString('fr-FR',{weekday:'short'}),date:toDateStr(dd),dayNum:dd.getDate()};});
  },[currentDate]);

  const monthDays = useMemo(()=>{
    const y=currentDate.getFullYear(),m=currentDate.getMonth();
    const first=new Date(y,m,1),last=new Date(y,m+1,0),startDay=(first.getDay()+6)%7;
    const days=[];
    for(let i=0;i<startDay;i++){const d=new Date(y,m,1-(startDay-i));days.push({date:toDateStr(d),day:d.getDate(),current:false});}
    for(let i=1;i<=last.getDate();i++)days.push({date:toDateStr(new Date(y,m,i)),day:i,current:true});
    while(days.length%7!==0){const d=new Date(y,m+1,days.length-last.getDate()-startDay+1);days.push({date:toDateStr(d),day:d.getDate(),current:false});}
    return days;
  },[currentDate]);

  const navigate=dir=>{const d=new Date(currentDate);if(view==='jour')d.setDate(d.getDate()+dir);else if(view==='semaine')d.setDate(d.getDate()+dir*7);else d.setMonth(d.getMonth()+dir);setCurrentDate(d);};
  const navLabel=()=>view==='jour'?currentDate.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}):view==='semaine'?`Sem. du ${weekDays[0]?.dayNum} au ${weekDays[6]?.dayNum} ${currentDate.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}`:currentDate.toLocaleDateString('fr-FR',{month:'long',year:'numeric'});
  const getSlot=(date,hour)=>allRdv.filter(r=>r.date===date&&r.time?.startsWith(hour.slice(0,2)));
  const getDay=date=>allRdv.filter(r=>r.date===date);
  const today=toDateStr();

  const handleSave=form=>{if(editRdv)updateRdv(editRdv.id,form);else addRdv(form);setEditRdv(null);};
  const handleStart=rdv=>{
    if(rdv.patientName&&!rdv.patientId)ensurePatient(rdv.patientName);
    updateRdv(rdv.id,{statut:'Consultation terminée'});
    setPage('consultation');
  };

  const btnStyle={borderRadius:7,padding:'5px 14px',fontSize:12,cursor:'pointer',fontFamily:'Plus Jakarta Sans, sans-serif'};

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="fade-up">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', gap:6 }}>
          {['Jour','Semaine','Mois'].map(v=>(
            <button key={v} onClick={()=>setView(v.toLowerCase())} style={{...btnStyle,background:view===v.toLowerCase()?T.tealDim:'transparent',border:`1px solid ${view===v.toLowerCase()?T.borderAccent:T.border}`,color:view===v.toLowerCase()?T.teal:T.textSub}}>{v}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button className="btn-ghost" onClick={()=>navigate(-1)} style={{ fontSize:16, padding:'4px 10px' }}>←</button>
          <span style={{ fontSize:13, color:T.text, fontWeight:600, minWidth:280, textAlign:'center' }}>{navLabel()}</span>
          <button className="btn-ghost" onClick={()=>navigate(1)} style={{ fontSize:16, padding:'4px 10px' }}>→</button>
          <button className="btn-ghost" onClick={()=>setCurrentDate(new Date())} style={{ fontSize:12 }}>Aujourd'hui</button>
          <button className="btn-primary" style={{ fontSize:12, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }}
            onClick={()=>{setEditRdv(null);setSelectedDay(view==='jour'?toDateStr(currentDate):null);setModal(true);}}>
            <Icon name="plus" size={12} color="#000" /> Nouveau RDV
          </button>
        </div>
      </div>

      {view==='semaine'&&(
        <>
          <div style={{ display:'grid', gridTemplateColumns:`58px repeat(7,1fr)`, gap:1, background:T.border, borderRadius:'12px 12px 0 0', overflow:'hidden' }}>
            <div style={{ background:T.surface, padding:10 }} />
            {weekDays.map(d=>(
              <div key={d.date} style={{ background:d.date===today?T.tealDim:T.surface, padding:'10px 12px', textAlign:'center', borderLeft:`1px solid ${T.border}` }}>
                <div style={{ fontSize:10, color:T.textMuted }}>{d.label}</div>
                <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:20, color:d.date===today?T.teal:T.text, marginTop:2 }}>{d.dayNum}</div>
                {getDay(d.date).some(r=>r.pinned)&&<div style={{ fontSize:9, color:T.amber }}>📌</div>}
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`58px repeat(7,1fr)`, gap:0, background:T.border, borderRadius:'0 0 12px 12px', overflow:'hidden' }}>
            {HOURS.map(hour=>(
              <div key={hour} style={{ display:'contents' }}>
                <div style={{ background:T.surface, padding:'8px 6px', borderBottom:`1px solid ${T.border}`, textAlign:'right' }}>
                  <span style={{ fontSize:10, color:T.textMuted }}>{hour}</span>
                </div>
                {weekDays.map(day=>{
                  const rdvs=getSlot(day.date,hour);
                  return (
                    <div key={`${day.date}-${hour}`} onDoubleClick={()=>{setEditRdv(null);setSelectedDay(day.date);setModal(true);}}
                      style={{ background:day.date===today?`${T.teal}04`:T.surface, borderBottom:`1px solid ${T.border}`, borderLeft:`1px solid ${T.border}`, padding:3, minHeight:52 }}>
                      {rdvs.map(r=><RdvCard key={r.id} rdv={r} onEdit={r=>{setEditRdv(r);setModal(true);}} onDelete={setDelTarget} onStart={handleStart} />)}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {view==='jour'&&(
        <Card style={{ padding:0, overflow:'hidden' }}>
          {HOURS.map(hour=>{
            const rdvs=getSlot(toDateStr(currentDate),hour);
            return (
              <div key={hour} style={{ display:'grid', gridTemplateColumns:'60px 1fr', borderBottom:`1px solid ${T.border}`, minHeight:60 }}>
                <div style={{ padding:'8px', display:'flex', alignItems:'flex-start', justifyContent:'flex-end' }}>
                  <span style={{ fontSize:11, color:T.textMuted }}>{hour}</span>
                </div>
                <div style={{ padding:'4px 8px', borderLeft:`1px solid ${T.border}` }}>
                  {rdvs.map(r=><RdvCard key={r.id} rdv={r} onEdit={r=>{setEditRdv(r);setModal(true);}} onDelete={setDelTarget} onStart={handleStart} />)}
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {view==='mois'&&(
        <div style={{ background:T.border, borderRadius:12, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', background:T.surface }}>
            {['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d=><div key={d} style={{ padding:'8px', textAlign:'center', fontSize:11, color:T.textMuted, fontWeight:600 }}>{d}</div>)}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1 }}>
            {monthDays.map((d,i)=>{
              const dayRdv=getDay(d.date);const hasPinned=dayRdv.some(r=>r.pinned);
              return (
                <div key={i} onDoubleClick={()=>{setSelectedDay(d.date);setEditRdv(null);setModal(true);}} style={{ background:d.date===today?`${T.teal}12`:T.surface, minHeight:80, padding:6 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:d.date===today?700:400, color:d.date===today?T.teal:d.current?T.text:T.textMuted }}>{d.day}</span>
                    {hasPinned&&<span style={{ fontSize:10 }}>📌</span>}
                  </div>
                  {dayRdv.slice(0,3).map(r=>(
                    <div key={r.id} onClick={()=>{setEditRdv(r);setModal(true);}} style={{ fontSize:9, padding:'2px 5px', borderRadius:3, background:`${STATUS_COLOR[r.statut]||T.blue}22`, color:STATUS_COLOR[r.statut]||T.blue, marginBottom:2, cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {r.pinned?'📌 ':''}{r.time} {r.patientName}
                    </div>
                  ))}
                  {dayRdv.length>3&&<div style={{ fontSize:9, color:T.textMuted }}>+{dayRdv.length-3}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <RdvModal open={modal} onClose={()=>{setModal(false);setEditRdv(null);setSelectedDay(null);}} onSave={handleSave} rdv={editRdv} defaultDate={selectedDay||(view==='jour'?toDateStr(currentDate):'')} />
      <ConfirmDialog open={!!delTarget} onClose={()=>setDelTarget(null)} onConfirm={()=>deleteRdv(delTarget?.id)} title="Supprimer le rendez-vous" message={`Supprimer le RDV de ${delTarget?.patientName} du ${delTarget?.date} à ${delTarget?.time} ?`} danger />
    </div>
  );
};

export default CalendarPage;
