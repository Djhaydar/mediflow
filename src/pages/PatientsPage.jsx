import { useState, useEffect } from 'react';
import { T } from '../theme';
import Icon from '../components/Icon';
import { Card, Avatar, Badge, Modal, ConfirmDialog, Field, Tabs, Empty } from '../components/UI';
import { useApp } from '../context/AppContext';
import { toDateStr, BLOOD_GROUPS, DOC_TYPES } from '../db/database';

const PatientModal = ({ open, onClose, onSave, patient=null }) => {
  const blank = { firstName:'', lastName:'', age:'', sexe:'', phone:'', address:'', bloodGroup:'', allergies:'', chronicDiseases:'', insurance:'' };
  const [form, setForm] = useState(blank);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  useEffect(() => { if(open) setForm(patient ? {...blank,...patient} : blank); }, [open, patient]);

  return (
    <Modal open={open} onClose={onClose} title={patient?'Modifier le patient':'Nouveau patient'} width={560}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Prénom *"><input className="input-base" value={form.firstName} onChange={e=>set('firstName',e.target.value)} placeholder="Prénom" /></Field>
          <Field label="Nom *"><input className="input-base" value={form.lastName} onChange={e=>set('lastName',e.target.value)} placeholder="Nom" /></Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <Field label="Âge"><input type="number" className="input-base" value={form.age} onChange={e=>set('age',e.target.value)} placeholder="Âge" /></Field>
          <Field label="Sexe">
            <select className="input-base" value={form.sexe} onChange={e=>set('sexe',e.target.value)}>
              <option value="">—</option><option value="M">Masculin</option><option value="F">Féminin</option>
            </select>
          </Field>
          <Field label="Groupe sanguin">
            <select className="input-base" value={form.bloodGroup} onChange={e=>set('bloodGroup',e.target.value)}>
              <option value="">—</option>
              {BLOOD_GROUPS.map(b=><option key={b} value={b}>{b}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Téléphone"><input className="input-base" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="0550 000 000" /></Field>
          <Field label="Adresse"><input className="input-base" value={form.address} onChange={e=>set('address',e.target.value)} placeholder="Adresse" /></Field>
        </div>
        <Field label="Allergies"><input className="input-base" value={form.allergies} onChange={e=>set('allergies',e.target.value)} placeholder="Pénicilline, aspirine..." /></Field>
        <Field label="Maladies chroniques"><input className="input-base" value={form.chronicDiseases} onChange={e=>set('chronicDiseases',e.target.value)} placeholder="Diabète, hypertension..." /></Field>
        <Field label="Assurance"><input className="input-base" value={form.insurance} onChange={e=>set('insurance',e.target.value)} placeholder="CNAS, CASNOS..." /></Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>{if(!form.lastName)return;onSave({...form,age:Number(form.age)||0});onClose();}}>
            {patient?'Enregistrer':'Ajouter le patient'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const DocModal = ({ open, onClose, onSave, patientId }) => {
  const [form, setForm] = useState({ type:'Analyse', title:'', notes:'', date:toDateStr(), fileData:'', fileName:'' });
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  useEffect(()=>{ if(open) setForm({ type:'Analyse', title:'', notes:'', date:toDateStr(), fileData:'', fileName:'' }); },[open]);

  const handleFile = (e) => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{set('fileData',ev.target.result);set('fileName',file.name);};
    reader.readAsDataURL(file);
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un document" width={480}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Type">
            <select className="input-base" value={form.type} onChange={e=>set('type',e.target.value)}>
              {DOC_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Date"><input type="date" className="input-base" value={form.date} onChange={e=>set('date',e.target.value)} /></Field>
        </div>
        <Field label="Titre *"><input className="input-base" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Ex: Analyse glycémie" /></Field>
        <Field label="Notes"><textarea className="input-base" rows={2} value={form.notes} onChange={e=>set('notes',e.target.value)} style={{resize:'vertical'}} /></Field>
        <Field label="Importer un fichier">
          <div style={{ border:`2px dashed ${T.border}`, borderRadius:10, padding:16, textAlign:'center', cursor:'pointer' }} onClick={()=>document.getElementById('docFile_'+patientId).click()}>
            <input id={'docFile_'+patientId} type="file" style={{ display:'none' }} onChange={handleFile} />
            {form.fileName ? <div style={{ fontSize:13, color:T.teal }}>{form.fileName}</div> : (
              <><Icon name="document" size={20} color={T.textMuted} /><div style={{ fontSize:12, color:T.textMuted, marginTop:6 }}>Cliquer pour importer</div></>
            )}
          </div>
        </Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>{if(!form.title)return;onSave({...form,patientId});onClose();}}>Ajouter</button>
        </div>
      </div>
    </Modal>
  );
};

const PatientDetail = ({ patientId, onBack, setPage }) => {
  const { getPatient, getPatientConsultations, getPatientDocuments, addDocument, deleteDocument, updatePatient } = useApp();
  const patient = getPatient(patientId); // always fresh from DB
  const [tab, setTab] = useState('Profil');
  const [editModal, setEditModal] = useState(false);
  const [docModal, setDocModal] = useState(false);
  const [delDoc, setDelDoc] = useState(null);

  if (!patient) return <div style={{ color:T.textMuted, padding:40, textAlign:'center' }}>Patient introuvable</div>;

  const consultations = getPatientConsultations(patient.id);
  const documents     = getPatientDocuments(patient.id);
  const initials = ((patient.firstName?.[0]||'')+(patient.lastName?.[0]||'')).toUpperCase()||'?';

  return (
    <div className="fade-up">
      <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:T.textSub, cursor:'pointer', marginBottom:16, fontSize:13 }}>
        ← Retour aux patients
      </button>

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Card style={{ textAlign:'center', padding:24 }}>
            <Avatar initials={initials} size={64} />
            <div style={{ marginTop:12, fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:18, color:T.text }}>{patient.firstName} {patient.lastName}</div>
            <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>
              {patient.age?`${patient.age} ans`:''}{patient.sexe?` · ${patient.sexe==='M'?'Masculin':'Féminin'}`:''}
            </div>
            {patient.bloodGroup&&(
              <div style={{ marginTop:8, display:'flex', justifyContent:'center' }}>
                <div style={{ padding:'4px 12px', borderRadius:6, background:T.redDim, color:T.red, fontSize:12, fontWeight:600 }}>{patient.bloodGroup}</div>
              </div>
            )}
            <div style={{ display:'flex', gap:8, marginTop:14, justifyContent:'center' }}>
              <button className="btn-primary" style={{ fontSize:11, padding:'5px 12px' }} onClick={()=>setPage('consultation')}>Consultation</button>
              <button className="btn-ghost" style={{ fontSize:11, padding:'5px 12px' }} onClick={()=>setEditModal(true)}>Modifier</button>
            </div>
          </Card>

          <Card style={{ padding:14 }}>
            {[['Téléphone',patient.phone],['Adresse',patient.address],['Assurance',patient.insurance],['Allergies',patient.allergies],['Maladies chroniques',patient.chronicDiseases]].filter(([,v])=>v).map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:`1px solid ${T.border}`, gap:8 }}>
                <span style={{ fontSize:11, color:T.textMuted, flexShrink:0 }}>{k}</span>
                <span style={{ fontSize:11, color:T.text, fontWeight:500, textAlign:'right' }}>{v}</span>
              </div>
            ))}
            {!patient.phone&&!patient.address&&<div style={{ fontSize:12, color:T.textMuted, textAlign:'center', padding:'10px 0' }}>Compléter le profil</div>}
          </Card>
        </div>

        <Card>
          <Tabs tabs={['Profil','Historique','Dossier']} active={tab} onChange={setTab} />

          {tab==='Profil'&&(
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                {[['Prénom',patient.firstName||'—'],['Nom',patient.lastName||'—'],['Âge',patient.age?`${patient.age} ans`:'—'],['Sexe',patient.sexe==='M'?'Masculin':patient.sexe==='F'?'Féminin':'—'],['Téléphone',patient.phone||'—'],['Adresse',patient.address||'—'],['Groupe sanguin',patient.bloodGroup||'—'],['Assurance',patient.insurance||'—']].map(([k,v])=>(
                  <div key={k} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:10, color:T.textMuted, marginBottom:4 }}>{k}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{v}</div>
                  </div>
                ))}
              </div>
              {patient.allergies&&(
                <div style={{ marginTop:12, background:T.redDim, border:`1px solid ${T.red}44`, borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.red, marginBottom:4 }}>⚠ Allergies</div>
                  <div style={{ fontSize:12, color:T.textSub }}>{patient.allergies}</div>
                </div>
              )}
              {patient.chronicDiseases&&(
                <div style={{ marginTop:12, background:T.amberDim, border:`1px solid ${T.amber}44`, borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:T.amber, marginBottom:4 }}>Maladies chroniques</div>
                  <div style={{ fontSize:12, color:T.textSub }}>{patient.chronicDiseases}</div>
                </div>
              )}
            </div>
          )}

          {tab==='Historique'&&(
            <div>
              {consultations.length===0 ? (
                <Empty icon="stethoscope" title="Aucune consultation" sub="L'historique apparaîtra après les consultations" />
              ) : (
                consultations.map(c=>(
                  <div key={c.id} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom:`1px solid ${T.border}` }}>
                    <div style={{ width:36, height:36, borderRadius:8, background:T.blueDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Icon name="stethoscope" size={15} color={T.blue} />
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.text }}>Consultation <span style={{ color:T.textMuted, fontWeight:400 }}>· {c.date}</span></div>
                      {c.motif&&<div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>Motif: {c.motif}</div>}
                      {c.diagnostic&&<div style={{ fontSize:11, color:T.textSub }}>Diagnostic: {c.diagnostic}</div>}
                      {c.medications?.length>0&&<div style={{ fontSize:11, color:T.purple, marginTop:2 }}>Ordonnance: {c.medications.map(m=>`${m.name} ${m.dose}`).join(', ')}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab==='Dossier'&&(
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:14 }}>
                <button className="btn-primary" style={{ fontSize:12, padding:'6px 14px', display:'flex', alignItems:'center', gap:6 }} onClick={()=>setDocModal(true)}>
                  <Icon name="plus" size={12} color="#000" /> Ajouter un document
                </button>
              </div>
              {documents.length===0 ? (
                <Empty icon="document" title="Aucun document" sub="Analyses, radios, ordonnances..." />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {documents.map(d=>(
                    <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10 }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:T.tealDim, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon name="document" size={15} color={T.teal} />
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{d.title}</div>
                        <div style={{ fontSize:11, color:T.textMuted }}>{d.type} · {d.date}</div>
                        {d.notes&&<div style={{ fontSize:11, color:T.textSub, marginTop:2 }}>{d.notes}</div>}
                      </div>
                      {d.fileData&&<a href={d.fileData} download={d.fileName} style={{ fontSize:11, color:T.teal, textDecoration:'none', background:T.tealDim, padding:'4px 10px', borderRadius:6 }}>Télécharger</a>}
                      <button onClick={()=>setDelDoc(d)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                        <Icon name="trash" size={14} color={T.red} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <PatientModal open={editModal} onClose={()=>setEditModal(false)} onSave={data=>updatePatient(patient.id,data)} patient={patient} />
      <DocModal open={docModal} onClose={()=>setDocModal(false)} onSave={addDocument} patientId={patient.id} />
      <ConfirmDialog open={!!delDoc} onClose={()=>setDelDoc(null)} onConfirm={()=>deleteDocument(delDoc?.id)} title="Supprimer le document" message={`Supprimer "${delDoc?.title}" ?`} danger />
    </div>
  );
};

const PatientCard = ({ patient, onProfile, onDelete, onConsult }) => {
  const [menu, setMenu] = useState(false);
  const initials = ((patient.firstName?.[0]||'')+(patient.lastName?.[0]||'')).toUpperCase()||'?';

  return (
    <Card style={{ display:'flex', flexDirection:'column', gap:12, position:'relative', cursor:'pointer' }} onClick={onProfile}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <Avatar initials={initials} size={42} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600, fontSize:14, color:T.text }}>{patient.firstName} {patient.lastName}</div>
          <div style={{ fontSize:11, color:T.textMuted }}>{patient.age?`${patient.age} ans`:''}{patient.phone?` · ${patient.phone}`:''}</div>
        </div>
        <button
          onMouseDown={e=>{e.stopPropagation();setMenu(m=>!m);}}
          onClick={e=>e.stopPropagation()}
          onBlur={()=>setTimeout(()=>setMenu(false),150)}
          style={{ background:'none', border:'none', cursor:'pointer', color:T.textMuted, padding:'4px 8px', borderRadius:6, fontSize:18 }}>⋮</button>
        {menu&&(
          <div onClick={e=>e.stopPropagation()} style={{ position:'absolute', top:44, right:12, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:'hidden', zIndex:99, minWidth:160, boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
            {[
              { label:'Consultation', icon:'stethoscope', color:T.teal,  fn:onConsult },
              { label:'Voir profil',  icon:'user',        color:T.blue,  fn:onProfile },
              { label:'Supprimer',    icon:'trash',       color:T.red,   fn:onDelete  },
            ].map(item=>(
              <div key={item.label} className="hover-card" onClick={()=>{setMenu(false);item.fn();}}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer', borderBottom:`1px solid ${T.border}` }}>
                <Icon name={item.icon} size={13} color={item.color} />
                <span style={{ fontSize:13, color:item.color }}>{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', paddingTop:8, borderTop:`1px solid ${T.border}` }}>
        <div>
          <div style={{ fontSize:10, color:T.textMuted }}>Maladies chroniques</div>
          <div style={{ fontSize:12, color:T.text, marginTop:2 }}>{patient.chronicDiseases||'Aucune'}</div>
        </div>
        {patient.bloodGroup&&(
          <div style={{ padding:'3px 8px', borderRadius:6, background:T.redDim, color:T.red, fontSize:11, fontWeight:600, alignSelf:'flex-end' }}>{patient.bloodGroup}</div>
        )}
      </div>
    </Card>
  );
};

const PatientsPage = ({ setPage }) => {
  const { getPatients, addPatient, deletePatient } = useApp();
  const [search, setSearch]     = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [addModal, setAddModal] = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [filterSexe, setFilterSexe] = useState('');
  const [filterSort, setFilterSort] = useState('name');

  if (selectedId) {
    return <PatientDetail patientId={selectedId} onBack={()=>setSelectedId(null)} setPage={setPage} />;
  }

  const patients = getPatients();
  let filtered = patients.filter(p=>{
    const q=search.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q)||p.phone?.includes(q)||p.chronicDiseases?.toLowerCase().includes(q);
  });
  if(filterSexe) filtered=filtered.filter(p=>p.sexe===filterSexe);
  if(filterSort==='name')   filtered=filtered.sort((a,b)=>`${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`));
  if(filterSort==='age')    filtered=filtered.sort((a,b)=>(b.age||0)-(a.age||0));
  if(filterSort==='recent') filtered=filtered.sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="fade-up">
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, maxWidth:360 }}>
          <Icon name="search" size={14} color={T.textMuted} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
          <input className="input-base" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par nom, téléphone..." style={{ paddingLeft:34 }} />
        </div>
        <select className="input-base" value={filterSexe} onChange={e=>setFilterSexe(e.target.value)} style={{ width:120 }}>
          <option value="">Tous</option><option value="M">Masculin</option><option value="F">Féminin</option>
        </select>
        <select className="input-base" value={filterSort} onChange={e=>setFilterSort(e.target.value)} style={{ width:150 }}>
          <option value="name">Trier par nom</option>
          <option value="age">Trier par âge</option>
          <option value="recent">Ajout récent</option>
        </select>
        <div style={{ fontSize:12, color:T.textMuted }}>{filtered.length} patient{filtered.length!==1?'s':''}</div>
        <button className="btn-primary" style={{ fontSize:12, padding:'7px 14px', display:'flex', alignItems:'center', gap:6 }} onClick={()=>setAddModal(true)}>
          <Icon name="plus" size={12} color="#000" /> Nouveau patient
        </button>
      </div>

      {filtered.length===0 ? (
        <Empty icon="patients" title="Aucun patient" sub="Commencez par ajouter votre premier patient"
          action={<button className="btn-primary" onClick={()=>setAddModal(true)}>Ajouter un patient</button>} />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:12 }}>
          {filtered.map(p=>(
            <PatientCard key={p.id} patient={p}
              onProfile={()=>setSelectedId(p.id)}
              onDelete={()=>setDelTarget(p)}
              onConsult={()=>setPage('consultation')}
            />
          ))}
        </div>
      )}

      <PatientModal open={addModal} onClose={()=>setAddModal(false)} onSave={addPatient} />
      <ConfirmDialog open={!!delTarget} onClose={()=>setDelTarget(null)}
        onConfirm={()=>deletePatient(delTarget?.id)}
        title="Supprimer le patient"
        message={`Supprimer définitivement ${delTarget?.firstName} ${delTarget?.lastName} et tout son historique ?`} danger />
    </div>
  );
};

export default PatientsPage;
