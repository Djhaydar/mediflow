import { useState } from 'react';
import { T } from '../theme';
import Icon from '../components/Icon';
import { Card, Modal, Field, ConfirmDialog, Empty } from '../components/UI';
import { useApp } from '../context/AppContext';
import { FORMES, CLASSES } from '../db/database';

const MedModal = ({ open, onClose, onSave, med=null }) => {
  const blank = { nom:'', dci:'', dosage:'', forme:'Comprimé', classe:'Analgésique', posologie:'', indication:'', contreIndication:'', favorite:false };
  const [form, setForm] = useState(med||blank);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  return (
    <Modal open={open} onClose={onClose} title={med?'Modifier le médicament':'Nouveau médicament'} width={540}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Nom commercial *"><input className="input-base" value={form.nom} onChange={e=>set('nom',e.target.value)} placeholder="Paracétamol" /></Field>
          <Field label="DCI"><input className="input-base" value={form.dci} onChange={e=>set('dci',e.target.value)} placeholder="Paracétamol" /></Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
          <Field label="Dosage"><input className="input-base" value={form.dosage} onChange={e=>set('dosage',e.target.value)} placeholder="1000 mg" /></Field>
          <Field label="Forme">
            <select className="input-base" value={form.forme} onChange={e=>set('forme',e.target.value)}>
              {FORMES.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Classe">
            <select className="input-base" value={form.classe} onChange={e=>set('classe',e.target.value)}>
              {CLASSES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Posologie"><input className="input-base" value={form.posologie} onChange={e=>set('posologie',e.target.value)} placeholder="3×/jour au repas" /></Field>
        <Field label="Indications"><textarea className="input-base" rows={2} value={form.indication} onChange={e=>set('indication',e.target.value)} style={{ resize:'vertical' }} /></Field>
        <Field label="Contre-indications"><textarea className="input-base" rows={2} value={form.contreIndication} onChange={e=>set('contreIndication',e.target.value)} style={{ resize:'vertical' }} /></Field>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:form.favorite?T.amberDim:T.card, border:`1px solid ${form.favorite?T.amber+'44':T.border}`, borderRadius:10, cursor:'pointer' }} onClick={()=>set('favorite',!form.favorite)}>
          <span style={{ fontSize:20 }}>⭐</span>
          <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600, color:T.text }}>Médicament favori</div><div style={{ fontSize:11, color:T.textMuted }}>Accessible rapidement depuis ordonnances et papiers</div></div>
          <div style={{ width:36, height:20, borderRadius:10, background:form.favorite?T.amber:T.border, position:'relative', transition:'background 0.2s', flexShrink:0 }}>
            <div style={{ width:14, height:14, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:form.favorite?18:3, transition:'left 0.2s' }} />
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>{if(!form.nom)return;onSave({...form});onClose();}}>
            {med?'Enregistrer':'Ajouter le médicament'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const MedicationsPage = () => {
  const { getMedications, addMedication, updateMedication, deleteMedication } = useApp();
  const [search, setSearch] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterForme, setFilterForme]   = useState('');
  const [filterFav, setFilterFav]       = useState(false);
  const [expanded, setExpanded]         = useState(null);
  const [addModal, setAddModal]         = useState(false);
  const [editMed, setEditMed]           = useState(null);
  const [delMed, setDelMed]             = useState(null);

  const meds = getMedications();
  let filtered = meds.filter(m=>{
    const q=search.toLowerCase();
    return (!q||(m.nom.toLowerCase().includes(q)||m.dci.toLowerCase().includes(q)||m.classe.toLowerCase().includes(q)))
      &&(!filterClasse||m.classe===filterClasse)
      &&(!filterForme||m.forme===filterForme)
      &&(!filterFav||m.favorite);
  });

  const usedClasses=[...new Set(meds.map(m=>m.classe))].sort();
  const usedFormes =[...new Set(meds.map(m=>m.forme))].sort();

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }} className="fade-up">
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, maxWidth:360 }}>
          <Icon name="search" size={14} color={T.textMuted} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }} />
          <input className="input-base" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par nom, DCI, classe..." style={{ paddingLeft:34 }} />
        </div>
        <select className="input-base" value={filterClasse} onChange={e=>setFilterClasse(e.target.value)} style={{ width:180 }}>
          <option value="">Toutes les classes</option>
          {usedClasses.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-base" value={filterForme} onChange={e=>setFilterForme(e.target.value)} style={{ width:140 }}>
          <option value="">Toutes les formes</option>
          {usedFormes.map(f=><option key={f} value={f}>{f}</option>)}
        </select>
        <button onClick={()=>setFilterFav(v=>!v)} style={{ padding:'7px 14px', borderRadius:8, border:`1px solid ${filterFav?T.amber+'44':T.border}`, background:filterFav?T.amberDim:'transparent', color:filterFav?T.amber:T.textSub, cursor:'pointer', fontSize:12 }}>
          ⭐ Favoris
        </button>
        <div style={{ fontSize:12, color:T.textMuted }}>{filtered.length} médicament{filtered.length!==1?'s':''}</div>
        <button className="btn-primary" style={{ fontSize:12, padding:'7px 14px', display:'flex', alignItems:'center', gap:6 }} onClick={()=>{setEditMed(null);setAddModal(true);}}>
          <Icon name="plus" size={12} color="#000" /> Nouveau
        </button>
      </div>

      {filtered.length===0 ? (
        <Empty icon="medications" title="Aucun médicament" sub="Ajoutez des médicaments à la base" />
      ) : (
        <Card style={{ padding:0, overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'32px 2fr 1fr 1fr 1fr 100px', padding:'10px 16px', background:T.card, borderBottom:`1px solid ${T.border}`, fontSize:11, fontWeight:700, color:T.textMuted, letterSpacing:'0.06em' }}>
            <div />
            <div>NOM / DCI</div>
            <div>DOSAGE & FORME</div>
            <div>CLASSE</div>
            <div>POSOLOGIE</div>
            <div style={{ textAlign:'right' }}>ACTIONS</div>
          </div>
          {filtered.map(m=>(
            <div key={m.id}>
              <div style={{ display:'grid', gridTemplateColumns:'32px 2fr 1fr 1fr 1fr 100px', padding:'12px 16px', borderBottom:`1px solid ${T.border}`, alignItems:'center', cursor:'pointer' }} className="hover-card"
                onClick={()=>setExpanded(expanded===m.id?null:m.id)}>
                <span style={{ fontSize:16, color:T.amber }}>{m.favorite?'⭐':'·'}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{m.nom}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{m.dci}</div>
                </div>
                <div style={{ fontSize:12, color:T.textSub }}>{m.dosage} · {m.forme}</div>
                <div style={{ fontSize:12, color:T.purple }}>{m.classe}</div>
                <div style={{ fontSize:11, color:T.textSub }}>{m.posologie}</div>
                <div style={{ display:'flex', gap:6, justifyContent:'flex-end' }}>
                  <button onClick={e=>{e.stopPropagation();updateMedication(m.id,{favorite:!m.favorite});}} style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:6, color:m.favorite?T.amber:T.textMuted }}>
                    {m.favorite?'★':'☆'}
                  </button>
                  <button onClick={e=>{e.stopPropagation();setEditMed(m);setAddModal(true);}} style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:6 }}>
                    <Icon name="edit" size={14} color={T.blue} />
                  </button>
                  <button onClick={e=>{e.stopPropagation();setDelMed(m);}} style={{ background:'none', border:'none', cursor:'pointer', padding:4, borderRadius:6 }}>
                    <Icon name="trash" size={14} color={T.red} />
                  </button>
                </div>
              </div>
              {expanded===m.id&&(
                <div style={{ padding:'12px 60px', background:`${T.purple}08`, borderBottom:`1px solid ${T.border}`, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:T.teal, marginBottom:6 }}>Indications</div>
                    <div style={{ fontSize:12, color:T.textSub, lineHeight:1.6 }}>{m.indication||'Non spécifié'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, fontWeight:700, color:T.red, marginBottom:6 }}>Contre-indications</div>
                    <div style={{ fontSize:12, color:T.textSub, lineHeight:1.6 }}>{m.contreIndication||'Non spécifié'}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </Card>
      )}

      <MedModal open={addModal} onClose={()=>{setAddModal(false);setEditMed(null);}} onSave={editMed?data=>updateMedication(editMed.id,data):addMedication} med={editMed} />
      <ConfirmDialog open={!!delMed} onClose={()=>setDelMed(null)} onConfirm={()=>deleteMedication(delMed?.id)} title="Supprimer le médicament" message={`Supprimer "${delMed?.nom}" de la base ?`} danger />
    </div>
  );
};

export default MedicationsPage;
