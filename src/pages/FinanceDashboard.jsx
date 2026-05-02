import { useState } from 'react';
import { T } from '../theme';
import Icon from '../components/Icon';
import { Card, Badge, Modal, Field, ConfirmDialog, Empty } from '../components/UI';
import { useApp } from '../context/AppContext';
import { toDateStr } from '../db/database';

const SECTIONS = ['Aperçu','Paiements','Statistiques'];

// ── PIN Guard ─────────────────────────────────────────────
const PinGuard = ({ pin, onUnlock, onLock, locked }) => {
  const [input, setInput] = useState('');
  const [err, setErr]     = useState(false);

  const tryUnlock = () => {
    if(input===pin){onUnlock();setInput('');}
    else{setErr(true);setTimeout(()=>setErr(false),800);}
  };

  if(!locked) return (
    <button onClick={onLock} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:'5px 14px', cursor:'pointer', fontSize:12, color:T.textSub, display:'flex', alignItems:'center', gap:6 }}>
      <Icon name="lock" size={13} color={T.textSub} /> Masquer
    </button>
  );

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <input type="password" maxLength={8} className="input-base" value={input} onChange={e=>setInput(e.target.value)}
        onKeyDown={e=>e.key==='Enter'&&tryUnlock()}
        placeholder="PIN…"
        style={{ width:90, textAlign:'center', border:`1px solid ${err?T.red:T.border}`, fontSize:13 }} />
      <button className="btn-primary" style={{ fontSize:12, padding:'7px 14px' }} onClick={tryUnlock}>Afficher</button>
    </div>
  );
};

// ── Payment Modal ─────────────────────────────────────────
const PaymentModal = ({ open, onClose, onSave, payment=null }) => {
  const { getPatients } = useApp();
  const patients = getPatients();
  const blank = { date:toDateStr(), patientName:'', amount:'', type:'Consultation', description:'', statut:'Payé' };
  const [form, setForm] = useState(payment||blank);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  return (
    <Modal open={open} onClose={onClose} title={payment?'Modifier le paiement':'Nouveau paiement'} width={460}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Date"><input type="date" className="input-base" value={form.date} onChange={e=>set('date',e.target.value)} /></Field>
          <Field label="Montant (DA)"><input type="number" className="input-base" value={form.amount} onChange={e=>set('amount',e.target.value)} /></Field>
        </div>
        <Field label="Patient">
          <select className="input-base" value={form.patientName} onChange={e=>set('patientName',e.target.value)}>
            <option value="">Sélectionner…</option>
            {patients.map(p=><option key={p.id} value={`${p.firstName} ${p.lastName}`}>{p.firstName} {p.lastName}</option>)}
            <option value="__other__">Autre / Anonyme</option>
          </select>
          {form.patientName==='__other__'&&<input className="input-base" style={{marginTop:6}} value={form.patientNameFree||''} onChange={e=>set('patientNameFree',e.target.value)} placeholder="Nom" />}
        </Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Type">
            <select className="input-base" value={form.type} onChange={e=>set('type',e.target.value)}>
              {['Consultation','Acte','Certificat','Autre'].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select className="input-base" value={form.statut} onChange={e=>set('statut',e.target.value)}>
              <option value="Payé">Payé</option><option value="Non payé">Non payé</option>
            </select>
          </Field>
        </div>
        <Field label="Description"><input className="input-base" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Motif, acte…" /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>{onSave({...form,amount:Number(form.amount)||0});onClose();}}>
            {payment?'Enregistrer':'Ajouter'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Simple bar chart ──────────────────────────────────────
const BarChart = ({ data, valueKey, labelKey, color=T.teal, height=140 }) => {
  const max = Math.max(...data.map(d=>d[valueKey]), 1);
  return (
    <div style={{ display:'flex', gap:8, alignItems:'flex-end', height, padding:'8px 0' }}>
      {data.map((d,i)=>(
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{ fontSize:9, color:T.textMuted }}>{d[valueKey]||0}</div>
          <div style={{ width:'100%', background:`${color}33`, borderRadius:'4px 4px 0 0', height:`${(d[valueKey]/max)*100}%`, minHeight:4 }}>
            <div style={{ width:'100%', background:color, borderRadius:'4px 4px 0 0', height:'100%', opacity:0.85 }} />
          </div>
          <div style={{ fontSize:9, color:T.textMuted, textAlign:'center', whiteSpace:'nowrap' }}>{d[labelKey]}</div>
        </div>
      ))}
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────
const FinanceDashboard = () => {
  const { getFinance, addPayment, updatePayment, deletePayment, getStats, getSettings } = useApp();
  const [section, setSection] = useState('Aperçu');
  const [locked, setLocked]   = useState(false);
  const [modal, setModal]     = useState(false);
  const [editPmt, setEditPmt] = useState(null);
  const [delPmt, setDelPmt]   = useState(null);
  const [filterMonth, setFilterMonth] = useState('');

  const settings = getSettings();
  const pin      = settings.privatePin||'1234';
  const stats    = getStats();
  const finance  = getFinance();

  const thisMonth  = toDateStr().slice(0,7);
  const displayed  = filterMonth ? finance.filter(f=>f.date?.startsWith(filterMonth)) : finance;
  const totalPaid  = displayed.filter(f=>f.statut==='Payé').reduce((s,f)=>s+f.amount,0);
  const totalUnpaid= displayed.filter(f=>f.statut==='Non payé').reduce((s,f)=>s+f.amount,0);

  const monthlyData = stats.monthlyData;

  // diagnostics per month from consultations
  const { getConsultations } = useApp();
  const consultations = getConsultations();
  const diagCount = {};
  consultations.forEach(c=>{if(c.diagnostic)diagCount[c.diagnostic]=(diagCount[c.diagnostic]||0)+1;});
  const topDiags = Object.entries(diagCount).sort((a,b)=>b[1]-a[1]).slice(0,6);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }} className="fade-up">
      {/* Vertical tabs in a row */}
      <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
        {/* Left nav */}
        <div style={{ display:'flex', flexDirection:'column', gap:4, background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:10, flexShrink:0, width:170 }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:14, color:T.text, padding:'6px 6px 10px', borderBottom:`1px solid ${T.border}`, marginBottom:6 }}>Finance</div>
          {SECTIONS.map(s=>(
            <button key={s} onClick={()=>setSection(s)} style={{ textAlign:'left', background:section===s?T.tealDim:'transparent', border:`1px solid ${section===s?T.borderAccent:'transparent'}`, borderRadius:8, padding:'8px 10px', cursor:'pointer', color:section===s?T.teal:T.textSub, fontSize:13, fontWeight:section===s?600:400, width:'100%' }}>
              {s}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1 }}>
          {/* Lock/Unlock */}
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
            <PinGuard pin={pin} locked={locked} onUnlock={()=>setLocked(false)} onLock={()=>setLocked(true)} />
          </div>

          {locked&&(
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:80, gap:12 }}>
              <div style={{ width:60, height:60, borderRadius:'50%', background:T.tealDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name="lock" size={26} color={T.teal} />
              </div>
              <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:16, color:T.text }}>Section protégée</div>
              <div style={{ fontSize:13, color:T.textMuted }}>Saisissez le PIN pour accéder aux données financières</div>
            </div>
          )}

          {!locked&&section==='Aperçu'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:12 }}>
                {[
                  { label:'Revenus du jour',   value:`${stats.todayRevenue.toLocaleString('fr-FR')} DA`, color:T.teal,   icon:'finance'   },
                  { label:'Revenus ce mois',   value:`${stats.monthRevenue.toLocaleString('fr-FR')} DA`, color:T.blue,   icon:'finance'   },
                  { label:'Impayés',            value:`${totalUnpaid.toLocaleString('fr-FR')} DA`,        color:T.amber,  icon:'alert'     },
                  { label:'Consultations',      value:stats.monthConsults,                                color:T.purple, icon:'activity'  },
                ].map(k=>(
                  <Card key={k.label} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    <div style={{ width:36, height:36, borderRadius:9, background:`${k.color}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Icon name={k.icon} size={16} color={k.color} />
                    </div>
                    <div style={{ fontFamily:'Syne, sans-serif', fontSize:20, fontWeight:800, color:T.text }}>{k.value}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{k.label}</div>
                  </Card>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Card>
                  <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginBottom:14 }}>Revenus mensuels (6 mois)</div>
                  <BarChart data={monthlyData} valueKey="revenue" labelKey="month" color={T.teal} />
                </Card>
                <Card>
                  <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginBottom:14 }}>Consultations mensuelles</div>
                  <BarChart data={monthlyData} valueKey="consultations" labelKey="month" color={T.blue} />
                </Card>
              </div>

              <Card>
                <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginBottom:12 }}>Derniers paiements</div>
                {finance.slice(0,8).map(f=>(
                  <div key={f.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:T.tealDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon name="finance" size={14} color={T.teal} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{f.patientName||'—'}</div>
                      <div style={{ fontSize:11, color:T.textMuted }}>{f.type} · {f.date}</div>
                    </div>
                    <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:14, color:T.teal }}>{f.amount.toLocaleString('fr-FR')} DA</div>
                    <Badge status={f.statut} />
                  </div>
                ))}
                {finance.length===0&&<Empty icon="finance" title="Aucun paiement" sub="Les paiements apparaissent après les consultations" />}
              </Card>
            </div>
          )}

          {!locked&&section==='Paiements'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                <div>
                  <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Filtrer par mois</label>
                  <input type="month" className="input-base" value={filterMonth} onChange={e=>setFilterMonth(e.target.value)} style={{ width:160 }} />
                </div>
                <div style={{ flex:1 }} />
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ padding:'8px 14px', background:T.tealDim, border:`1px solid ${T.borderAccent}`, borderRadius:8 }}>
                    <div style={{ fontSize:10, color:T.textMuted }}>Total payé</div>
                    <div style={{ fontSize:15, fontWeight:700, color:T.teal }}>{totalPaid.toLocaleString('fr-FR')} DA</div>
                  </div>
                  <div style={{ padding:'8px 14px', background:T.amberDim, border:`1px solid ${T.amber}44`, borderRadius:8 }}>
                    <div style={{ fontSize:10, color:T.textMuted }}>Total impayé</div>
                    <div style={{ fontSize:15, fontWeight:700, color:T.amber }}>{totalUnpaid.toLocaleString('fr-FR')} DA</div>
                  </div>
                </div>
                <button className="btn-primary" style={{ fontSize:12, padding:'7px 14px', display:'flex', alignItems:'center', gap:6, alignSelf:'flex-end' }}
                  onClick={()=>{setEditPmt(null);setModal(true);}}>
                  <Icon name="plus" size={12} color="#000" /> Ajouter
                </button>
              </div>

              <Card style={{ padding:0, overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'100px 2fr 1fr 1fr 100px 80px', padding:'10px 16px', background:T.card, borderBottom:`1px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:'0.06em' }}>
                  <div>DATE</div><div>PATIENT</div><div>TYPE</div><div>MONTANT</div><div>STATUT</div><div style={{ textAlign:'right' }}>ACTIONS</div>
                </div>
                {displayed.length===0 ? (
                  <Empty icon="finance" title="Aucun paiement" sub="Ajoutez un paiement ou effectuez des consultations" />
                ) : displayed.map(f=>(
                  <div key={f.id} style={{ display:'grid', gridTemplateColumns:'100px 2fr 1fr 1fr 100px 80px', padding:'11px 16px', borderBottom:`1px solid ${T.border}`, alignItems:'center' }} className="hover-card">
                    <div style={{ fontSize:11, color:T.textMuted }}>{f.date}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{f.patientName||'—'}</div>
                    <div style={{ fontSize:12, color:T.textSub }}>{f.type}</div>
                    <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.teal }}>{f.amount.toLocaleString('fr-FR')} DA</div>
                    <Badge status={f.statut} />
                    <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                      <button onClick={()=>{setEditPmt(f);setModal(true);}} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><Icon name="edit" size={14} color={T.blue} /></button>
                      <button onClick={()=>setDelPmt(f)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><Icon name="trash" size={14} color={T.red} /></button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {!locked&&section==='Statistiques'&&(
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <Card>
                  <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginBottom:12 }}>Consultations — 6 derniers mois</div>
                  <BarChart data={monthlyData} valueKey="consultations" labelKey="month" color={T.blue} height={160} />
                </Card>
                <Card>
                  <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginBottom:12 }}>Revenus — 6 derniers mois</div>
                  <BarChart data={monthlyData} valueKey="revenue" labelKey="month" color={T.teal} height={160} />
                </Card>
              </div>

              <Card>
                <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginBottom:14 }}>Diagnostics fréquents</div>
                {topDiags.length===0 ? (
                  <Empty icon="stethoscope" title="Aucune donnée" sub="Les diagnostics apparaissent après les consultations" />
                ) : topDiags.map(([diag,count],i)=>{
                  const pct=Math.round((count/(topDiags[0][1]))*100);
                  return (
                    <div key={i} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:12, color:T.textSub }}>{diag}</span>
                        <span style={{ fontSize:11, color:T.textMuted }}>{count} consultation{count!==1?'s':''}</span>
                      </div>
                      <div style={{ height:6, borderRadius:3, background:T.card, overflow:'hidden' }}>
                        <div style={{ height:'100%', width:`${pct}%`, background:T.teal, borderRadius:3 }} />
                      </div>
                    </div>
                  );
                })}
              </Card>
            </div>
          )}
        </div>
      </div>

      <PaymentModal open={modal} onClose={()=>{setModal(false);setEditPmt(null);}} onSave={editPmt?data=>updatePayment(editPmt.id,data):addPayment} payment={editPmt} />
      <ConfirmDialog open={!!delPmt} onClose={()=>setDelPmt(null)} onConfirm={()=>deletePayment(delPmt?.id)} title="Supprimer le paiement" message={`Supprimer ce paiement de ${delPmt?.amount?.toLocaleString('fr-FR')} DA ?`} danger />
    </div>
  );
};

export default FinanceDashboard;
