import { useState } from 'react';
import { T } from '../theme';
import Icon from '../components/Icon';
import { Card, Field, Empty } from '../components/UI';
import { useApp } from '../context/AppContext';
import { toDateStr, searchMeds } from '../db/database';

const STEPS = ['Motif','Examen clinique','Diagnostic','Ordonnance','Clôture'];

const FREQ_QUICK = ['1×/j','2×/j','3×/j','Matin','Soir','Matin + Soir','Si besoin'];
const DUR_QUICK  = ['3 jours','5 jours','7 jours','10 jours','14 jours','1 mois','3 mois','6 mois','Long terme'];

const COMMON_DIAGNOSES = [
  'Rhinopharyngite aiguë','Angine','Amygdalite','Bronchite aiguë','Bronchiolite',
  'Pneumonie','Grippe','Sinusite aiguë','Otite moyenne aiguë','Laryngite',
  'Gastro-entérite aiguë','Gastrite','Reflux gastro-œsophagien','Colite','Constipation',
  'Hypertension artérielle','Insuffisance cardiaque','Palpitations','Tachycardie',
  'Diabète type 1','Diabète type 2','Hypoglycémie','Dyslipidémie','Obésité',
  'Migraine','Céphalée de tension','Vertiges','Malaise vagal',
  'Lombalgie aiguë','Lombalgie chronique','Cervicalgie','Sciatique','Arthrose',
  'Entorse','Fracture','Contusion','Traumatisme crânien','Plaie',
  'Cystite','Infection urinaire','Calcul rénal','Prostatite',
  'Dermatite','Urticaire','Eczéma','Psoriasis','Infection cutanée','Zona',
  'Anémie','Hypothyroïdie','Hyperthyroïdie','Allergie saisonnière','Asthme','BPCO',
  'Anxiété','Dépression','Insomnie','Burn-out','Stress chronique',
  'Conjonctivite','Blépharite','Corps étranger oculaire',
];

// ── MedSearch enrichi ─────────────────────────────────────
const MedSearch = ({ onAdd }) => {
  const { getMedications } = useApp();
  const [q, setQ]           = useState('');
  const [sel, setSel]       = useState(null);
  const [dose, setDose]     = useState('');
  const [freq, setFreq]     = useState('');
  const [dur, setDur]       = useState('');
  const [qte, setQte]       = useState('');
  const [dropOpen, setDropOpen] = useState(false);
  const meds = getMedications();
  const filtered = (dropOpen && q.length>1) ? searchMeds(meds, q, 8) : [];

  const handleAdd = () => {
    if(!sel) return;
    onAdd({ name:sel.nom, dci:sel.dci, dose:dose||sel.dosage, freq:freq||sel.posologie, dur, qte });
    setSel(null);setQ('');setDose('');setFreq('');setDur('');setQte('');setDropOpen(false);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {/* Recherche */}
      <div style={{ position:'relative' }}>
        <Icon name="search" size={13} color={T.textMuted} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
        <input className="input-base" value={q}
          onChange={e=>{setQ(e.target.value);setSel(null);setDropOpen(true);}}
          placeholder="Rechercher un médicament..." style={{ paddingLeft:30, fontSize:12 }} />
        {filtered.length>0&&(
          <div style={{ position:'absolute', top:'100%', left:0, right:0, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden', zIndex:99, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
            {filtered.map(m=>(
              <div key={m.id} className="hover-card"
                onClick={()=>{setSel(m);setQ(m.nom);setDose(m.dosage);setFreq(m.posologie);setDropOpen(false);}}
                style={{ padding:'8px 12px', cursor:'pointer', borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{m.nom} <span style={{ color:T.purple }}>{m.dosage}</span></div>
                <div style={{ fontSize:10, color:T.textMuted }}>{m.dci} · {m.classe}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {sel&&(
        <div style={{ background:`${T.purple}0a`, border:`1px solid ${T.purple}33`, borderRadius:10, padding:12 }}>
          {/* Dose + Qté */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 110px', gap:8, marginBottom:8 }}>
            <div>
              <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Dosage</label>
              <input className="input-base" value={dose} onChange={e=>setDose(e.target.value)} placeholder={sel.dosage} style={{ fontSize:12 }} />
            </div>
            <div>
              <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Qté (boîtes)</label>
              <input type="number" min="1" className="input-base" value={qte} onChange={e=>setQte(e.target.value)} placeholder="1" style={{ fontSize:12 }} />
            </div>
          </div>

          {/* Quick Fréquence */}
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Fréquence</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:5 }}>
              {FREQ_QUICK.map(f=>(
                <button key={f} onClick={()=>setFreq(f)} style={{ fontSize:11, padding:'3px 9px', borderRadius:6, cursor:'pointer', border:`1px solid ${freq===f?T.purple:T.border}`, background:freq===f?T.purple:T.card, color:freq===f?'#fff':T.textSub, transition:'all 0.15s' }}>{f}</button>
              ))}
            </div>
            <input className="input-base" value={freq} onChange={e=>setFreq(e.target.value)} placeholder="Ou saisir manuellement..." style={{ fontSize:12 }} />
          </div>

          {/* Quick Durée */}
          <div style={{ marginBottom:10 }}>
            <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Durée</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:5 }}>
              {DUR_QUICK.map(d=>(
                <button key={d} onClick={()=>setDur(d)} style={{ fontSize:11, padding:'3px 9px', borderRadius:6, cursor:'pointer', border:`1px solid ${dur===d?T.teal:T.border}`, background:dur===d?T.teal:T.card, color:dur===d?'#000':T.textSub, transition:'all 0.15s' }}>{d}</button>
              ))}
            </div>
            <input className="input-base" value={dur} onChange={e=>setDur(e.target.value)} placeholder="Ou saisir manuellement..." style={{ fontSize:12 }} />
          </div>

          <button onClick={handleAdd} style={{ width:'100%', background:T.purple, border:'none', borderRadius:7, padding:'9px', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <span style={{ fontSize:16, lineHeight:1 }}>+</span> Ajouter à l'ordonnance
          </button>
        </div>
      )}
    </div>
  );
};

// ── Diagnostic avec cases à cocher ────────────────────────
const DiagnosticStep = ({ selected, setSelected, custom, setCustom }) => {
  const [search, setSearch] = useState('');
  const shown = search.length > 1
    ? COMMON_DIAGNOSES.filter(d => d.toLowerCase().includes(search.toLowerCase()))
    : COMMON_DIAGNOSES;

  const toggle = (d) => setSelected(s => s.includes(d) ? s.filter(x=>x!==d) : [...s, d]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Recherche diagnostic */}
      <div style={{ position:'relative' }}>
        <Icon name="search" size={13} color={T.textMuted} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }} />
        <input className="input-base" value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="Filtrer les diagnostics..." style={{ paddingLeft:30, fontSize:12 }} />
      </div>

      {/* Sélectionnés */}
      {selected.length>0&&(
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {selected.map(d=>(
            <div key={d} style={{ display:'flex', alignItems:'center', gap:5, background:T.tealDim, border:`1px solid ${T.borderAccent}`, borderRadius:20, padding:'3px 10px', fontSize:11, color:T.teal }}>
              {d}
              <button onClick={()=>toggle(d)} style={{ background:'none', border:'none', cursor:'pointer', color:T.teal, padding:0, lineHeight:1, fontSize:13 }}>×</button>
            </div>
          ))}
          <button onClick={()=>setSelected([])} style={{ fontSize:10, color:T.textMuted, background:'none', border:`1px solid ${T.border}`, borderRadius:20, padding:'3px 10px', cursor:'pointer' }}>Tout effacer</button>
        </div>
      )}

      {/* Liste des diagnostics */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:12, padding:12, maxHeight:260, overflowY:'auto' }}>
        <div style={{ columns:2, columnGap:12 }}>
          {shown.map(d=>(
            <div key={d} onClick={()=>toggle(d)}
              style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 6px', borderRadius:7, cursor:'pointer', marginBottom:2, background:selected.includes(d)?T.tealDim:'transparent', breakInside:'avoid', transition:'background 0.15s' }}>
              <div style={{ width:16, height:16, borderRadius:4, border:`2px solid ${selected.includes(d)?T.teal:T.border}`, background:selected.includes(d)?T.teal:'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
                {selected.includes(d)&&<span style={{ color:'#000', fontSize:10, fontWeight:700, lineHeight:1 }}>✓</span>}
              </div>
              <span style={{ fontSize:11, color:selected.includes(d)?T.teal:T.textSub }}>{d}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Diagnostic libre / complémentaire */}
      <Field label="Précisions / Diagnostic complémentaire">
        <textarea rows={3} className="input-base" value={custom} onChange={e=>setCustom(e.target.value)}
          placeholder="Détails, diagnostics différentiels, observations..." style={{ resize:'vertical', fontSize:12 }} />
      </Field>
    </div>
  );
};

const ConsultationPage = () => {
  const { getPatients, getRdv, addConsultation, updateRdv, addPayment, getSettings, ensurePatient } = useApp();
  const [step, setStep]       = useState(0);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [motif, setMotif]     = useState('');
  const [duree, setDuree]     = useState('');
  const [aggravants, setAgg]  = useState('');
  const [antecedents, setAnte]= useState('');
  const [ta, setTa]           = useState('');
  const [fc, setFc]           = useState('');
  const [temp, setTemp]       = useState('');
  const [poids, setPoids]     = useState('');
  const [taille, setTaille]   = useState('');
  const [spo2, setSpo2]       = useState('');
  const [examenNotes, setExN] = useState('');
  // Diagnostic : checkboxes + texte libre
  const [diagSelected, setDiagSelected] = useState([]);
  const [diagCustom, setDiagCustom]     = useState('');
  const [meds, setMeds]       = useState([]);
  const [notes, setNotes]     = useState('');
  const [montant, setMontant] = useState('');
  const [done, setDone]       = useState(false);

  const patients = getPatients();
  const todayRdv = getRdv().filter(r=>r.date===toDateStr()&&(r.statut==='En consultation'||r.statut==='Consultation terminée'||r.statut==='Confirmé'||r.statut==='Programmé'));
  const settings = getSettings();

  const selPatient = patients.find(p=>p.id===Number(patientId));
  const displayName = selPatient ? `${selPatient.firstName} ${selPatient.lastName}` : patientName;

  // Diagnostic final = checkboxes + texte libre
  const buildDiagnostic = () => [...diagSelected, diagCustom].filter(Boolean).join(' — ');

  const handleFinish = () => {
    let pid = selPatient?.id || null;
    if (!pid && patientName.trim()) {
      const reg = ensurePatient(patientName.trim());
      pid = reg?.id || null;
    }
    const diagnostic = buildDiagnostic();

    addConsultation({
      patientId: pid, patientName: displayName, date: toDateStr(),
      motif, diagnostic, notes,
      vitals: { ta, fc, temp, poids, taille, spo2 },
      medications: meds,
      montant: Number(montant)||0,
    });

    if (Number(montant)>0) {
      addPayment({ date:toDateStr(), patientName:displayName, patientId:pid, amount:Number(montant), type:'Consultation', description:diagnostic||motif, statut:'Payé' });
    }

    const rdvMatch = todayRdv.find(r=>(r.patientId&&r.patientId===pid)||(r.patientName?.toLowerCase()===displayName.toLowerCase()));
    if (rdvMatch) updateRdv(rdvMatch.id, { statut:'Consultation terminée' });

    setDone(true);
  };

  const reset = () => {
    setStep(0);setPatientId('');setPatientName('');setMotif('');setDuree('');setAgg('');setAnte('');
    setTa('');setFc('');setTemp('');setPoids('');setTaille('');setSpo2('');setExN('');
    setDiagSelected([]);setDiagCustom('');setMeds([]);setNotes('');setMontant('');setDone(false);
  };

  if (done) {
    return (
      <div className="fade-up" style={{ display:'flex', justifyContent:'center', alignItems:'center', height:400 }}>
        <Card style={{ textAlign:'center', padding:48, maxWidth:440 }}>
          <div style={{ width:72, height:72, borderRadius:'50%', background:T.tealDim, border:`2px solid ${T.borderAccent}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <Icon name="check" size={32} color={T.teal} />
          </div>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:20, color:T.text, marginBottom:8 }}>Consultation enregistrée</div>
          <div style={{ fontSize:13, color:T.textMuted, marginBottom:24, lineHeight:1.6 }}>
            Dossier de <strong style={{ color:T.text }}>{displayName}</strong> mis à jour.
            {Number(montant)>0&&` Paiement de ${Number(montant).toLocaleString('fr-FR')} DA enregistré.`}
          </div>
          <button className="btn-primary" onClick={reset} style={{ padding:'10px 28px' }}>Nouvelle consultation</button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:16 }}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {/* Sélection patient */}
        <Card>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginBottom:12 }}>Patient</div>
          <select className="input-base" value={patientId} onChange={e=>setPatientId(e.target.value)} style={{ marginBottom:8, fontSize:12 }}>
            <option value="">Sélectionner un patient</option>
            {patients.map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
            <option value="__new__">+ Patient externe</option>
          </select>
          {patientId==='__new__'&&(
            <input className="input-base" value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="Nom du patient" style={{ fontSize:12 }} />
          )}
          {selPatient&&(
            <div style={{ marginTop:10, padding:10, background:T.blueDim, border:`1px solid ${T.blue}33`, borderRadius:8 }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.text }}>{selPatient.firstName} {selPatient.lastName}</div>
              <div style={{ fontSize:11, color:T.textMuted }}>{selPatient.age} ans{selPatient.bloodGroup?` · ${selPatient.bloodGroup}`:''}</div>
              {selPatient.allergies&&<div style={{ fontSize:10, color:T.red, marginTop:4 }}>⚠ {selPatient.allergies}</div>}
              {selPatient.chronicDiseases&&<div style={{ fontSize:10, color:T.amber, marginTop:2 }}>{selPatient.chronicDiseases}</div>}
            </div>
          )}
        </Card>

        {/* RDV du jour */}
        {todayRdv.length>0&&(
          <Card style={{ padding:14 }}>
            <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:12, color:T.text, marginBottom:8 }}>RDV du jour</div>
            {todayRdv.slice(0,5).map(r=>(
              <div key={r.id} className="hover-card"
                onClick={()=>{ const p=patients.find(pt=>pt.id===r.patientId); if(p) setPatientId(String(p.id)); else{setPatientId('__new__');setPatientName(r.patientName||'');} setMotif(r.motif||''); }}
                style={{ display:'flex', justifyContent:'space-between', padding:'7px 8px', borderRadius:7, marginBottom:3, cursor:'pointer' }}>
                <span style={{ fontSize:11, color:T.textSub }}>{r.patientName}</span>
                <span style={{ fontSize:10, color:T.teal }}>{r.time}</span>
              </div>
            ))}
          </Card>
        )}

        {/* Étapes */}
        <Card style={{ padding:14 }}>
          <div style={{ fontSize:11, color:T.textMuted, marginBottom:10, fontWeight:600, letterSpacing:'0.06em' }}>ÉTAPES</div>
          {STEPS.map((s,i)=>(
            <div key={s} onClick={()=>setStep(i)} style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 8px', borderRadius:8, background:i===step?T.tealDim:'transparent', marginBottom:2, cursor:'pointer' }}>
              <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, background:i<step?`${T.teal}44`:i===step?T.teal:T.border, display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:i===step?'#000':i<step?T.teal:T.textMuted }}>
                {i<step?'✓':i+1}
              </div>
              <span style={{ fontSize:12, color:i===step?T.teal:T.textSub }}>{s}</span>
            </div>
          ))}
        </Card>
      </div>

      <Card>
        <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:16, color:T.text, marginBottom:20 }}>{STEPS[step]}</div>

        {step===0&&(
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <Field label="Motif principal"><textarea rows={3} className="input-base" value={motif} onChange={e=>setMotif(e.target.value)} placeholder="Raison de la visite..." style={{ resize:'vertical' }} /></Field>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Field label="Durée des symptômes"><input className="input-base" value={duree} onChange={e=>setDuree(e.target.value)} placeholder="Ex: 3 jours" /></Field>
              <Field label="Facteurs aggravants"><input className="input-base" value={aggravants} onChange={e=>setAgg(e.target.value)} placeholder="Effort, alimentation..." /></Field>
            </div>
            <Field label="Antécédents / Traitements en cours"><textarea rows={2} className="input-base" value={antecedents} onChange={e=>setAnte(e.target.value)} style={{ resize:'vertical' }} /></Field>
          </div>
        )}

        {step===1&&(
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
              {[['Pression artérielle (mmHg)',ta,setTa,'120/80'],['Fréquence cardiaque (bpm)',fc,setFc,'70'],['Température (°C)',temp,setTemp,'37.0'],['Poids (kg)',poids,setPoids,'70'],['Taille (cm)',taille,setTaille,'170'],['SpO2 (%)',spo2,setSpo2,'98']].map(([label,val,setter,ph])=>(
                <Field key={label} label={label}><input className="input-base" value={val} onChange={e=>setter(e.target.value)} placeholder={ph} /></Field>
              ))}
            </div>
            <Field label="Notes examen clinique"><textarea rows={3} className="input-base" value={examenNotes} onChange={e=>setExN(e.target.value)} placeholder="Auscultation, palpation..." style={{ resize:'vertical' }} /></Field>
          </div>
        )}

        {step===2&&(
          <DiagnosticStep
            selected={diagSelected} setSelected={setDiagSelected}
            custom={diagCustom} setCustom={setDiagCustom}
          />
        )}

        {step===3&&(
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <MedSearch onAdd={med=>setMeds(ms=>[...ms,med])} />
            {meds.length>0&&(
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {meds.map((m,i)=>(
                  <div key={i} style={{ display:'flex', gap:10, padding:12, background:`${T.purple}0d`, border:`1px solid ${T.purple}33`, borderRadius:10 }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:T.purpleDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon name="pill" size={14} color={T.purple} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{m.name} <span style={{ color:T.purple }}>{m.dose}</span>
                        {m.qte&&<span style={{ fontSize:11, color:T.teal, marginLeft:8 }}>• {m.qte} boîte{m.qte>1?'s':''}</span>}
                      </div>
                      <div style={{ fontSize:11, color:T.textMuted }}>{m.freq}{m.dur?` — ${m.dur}`:''}</div>
                    </div>
                    <button onClick={()=>setMeds(ms=>ms.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:T.red, padding:4 }}>
                      <Icon name="close" size={13} color={T.red} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Field label="Instructions au patient"><textarea rows={2} className="input-base" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Instructions particulières..." style={{ resize:'vertical' }} /></Field>
          </div>
        )}

        {step===4&&(
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:T.tealDim, border:`1px solid ${T.borderAccent}`, borderRadius:12, padding:16 }}>
              <div style={{ fontWeight:600, fontSize:13, color:T.teal, marginBottom:10 }}>Résumé</div>
              {[
                ['Patient',displayName||'—'],
                ['Date',toDateStr()],
                ['Motif',motif||'—'],
                ['Diagnostic', buildDiagnostic()||'—'],
                ['Médicaments',meds.length>0?meds.map(m=>`${m.name} ${m.dose}`).join(', '):'Aucun'],
              ].map(([k,v])=>(
                <div key={k} style={{ display:'flex', gap:12, marginBottom:6 }}>
                  <span style={{ fontSize:12, color:T.textMuted, minWidth:120 }}>{k}</span>
                  <span style={{ fontSize:12, color:T.text, fontWeight:500 }}>{v}</span>
                </div>
              ))}
            </div>
            <Field label="Honoraires (DA)">
              <input type="number" className="input-base" value={montant} onChange={e=>setMontant(e.target.value)} placeholder={String(settings.consultFee||2000)} />
            </Field>
          </div>
        )}

        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 }}>
          {step>0&&<button className="btn-ghost" onClick={()=>setStep(s=>s-1)}>← Précédent</button>}
          {step<STEPS.length-1&&<button className="btn-primary" onClick={()=>setStep(s=>s+1)}>Continuer →</button>}
          {step===STEPS.length-1&&<button className="btn-primary" onClick={handleFinish} style={{ background:`linear-gradient(135deg,${T.teal},${T.blue})` }}>✓ Terminer & Enregistrer</button>}
        </div>
      </Card>
    </div>
  );
};

export default ConsultationPage;
