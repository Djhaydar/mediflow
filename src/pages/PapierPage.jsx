import { useState } from 'react';
import { T } from '../theme';
import Icon from '../components/Icon';
import { Card, Modal, Field, ConfirmDialog, Empty } from '../components/UI';
import { useApp } from '../context/AppContext';
import { toDateStr, ICON_EMOJIS, COLORS_PICK, BILAN_TESTS } from '../db/database';

// ── Template CRUD Modal ───────────────────────────────────
const TemplateModal = ({ open, onClose, onSave, tpl=null }) => {
  const blank = { name:'', icon:'📄', color:'#a78bfa', description:'', fields:['notes'] };
  const [form, setForm] = useState(tpl||blank);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  return (
    <Modal open={open} onClose={onClose} title={tpl?'Modifier le modèle':'Nouveau type de papier'} width={480}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Field label="Nom du papier *"><input className="input-base" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Ex: Demande d'hospitalisation" /></Field>
        <Field label="Description"><input className="input-base" value={form.description||''} onChange={e=>set('description',e.target.value)} placeholder="Brève description" /></Field>
        <Field label="Icône">
          <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
            {ICON_EMOJIS.map(em=>(
              <div key={em} onClick={()=>set('icon',em)} style={{ width:36, height:36, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, cursor:'pointer', background:form.icon===em?T.tealDim:T.card, border:`2px solid ${form.icon===em?T.teal:T.border}`, transition:'all 0.15s' }}>
                {em}
              </div>
            ))}
          </div>
        </Field>
        <Field label="Couleur">
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {COLORS_PICK.map(c=>(
              <div key={c} onClick={()=>set('color',c)} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border:`3px solid ${form.color===c?'#fff':'transparent'}`, outline:`2px solid ${form.color===c?c:'transparent'}`, transition:'all 0.15s' }} />
            ))}
          </div>
        </Field>
        <Field label="Contenu du modèle (sera personnalisé à l'utilisation)">
          <textarea className="input-base" rows={4} placeholder="Décrivez le contenu type de ce document..." style={{ resize:'vertical' }} />
        </Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={()=>{if(!form.name)return;onSave({...form});onClose();}}>
            {tpl?'Enregistrer':'Créer le modèle'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── 3D Paper Card ─────────────────────────────────────────
const PaperCard3D = ({ tpl, onClick, onEdit, onDelete, isDefault }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <div
        onMouseEnter={()=>setHovered(true)}
        onMouseLeave={()=>setHovered(false)}
        onClick={onClick}
        style={{ cursor:'pointer', transform:hovered?'translateY(-8px)':'translateY(0)', transition:'transform 0.25s cubic-bezier(.16,1,.3,1)' }}
      >
        <div style={{ background:`${tpl.color}18`, border:`1.5px solid ${tpl.color}44`, borderRadius:16, padding:'28px 20px 20px', textAlign:'center', boxShadow:hovered?`0 16px 40px ${tpl.color}33,0 4px 16px rgba(0,0,0,0.3)`:'0 4px 12px rgba(0,0,0,0.2)', transition:'box-shadow 0.25s', minHeight:150, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ width:64, height:64, borderRadius:14, background:`${tpl.color}22`, border:`1px solid ${tpl.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, boxShadow:hovered?`0 4px 16px ${tpl.color}33`:'none', transition:'box-shadow 0.25s' }}>
            {tpl.icon}
          </div>
          <div>
            <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginTop:12 }}>{tpl.name}</div>
            {tpl.description&&<div style={{ fontSize:10, color:T.textMuted, marginTop:3 }}>{tpl.description}</div>}
          </div>
        </div>
      </div>
      {/* Edit/Delete buttons (on hover) */}
      {hovered&&(
        <div style={{ position:'absolute', top:8, right:8, display:'flex', gap:4, zIndex:10 }}>
          {onEdit&&<button onClick={e=>{e.stopPropagation();onEdit();}} style={{ width:24, height:24, borderRadius:6, background:T.blueDim, border:`1px solid ${T.blue}44`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Icon name="edit" size={11} color={T.blue} />
          </button>}
          {!isDefault&&onDelete&&<button onClick={e=>{e.stopPropagation();onDelete();}} style={{ width:24, height:24, borderRadius:6, background:T.redDim, border:`1px solid ${T.red}44`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <Icon name="trash" size={11} color={T.red} />
          </button>}
        </div>
      )}
    </div>
  );
};

// ── Editor per paper type ─────────────────────────────────
const PaperEditor = ({ tpl, onClose }) => {
  const { getPatients, getMedications, getSettings, addDocument } = useApp();
  const patients = getPatients();
  const allMeds  = getMedications();
  const settings = getSettings();

  const FREQ_QUICK = ['1×/j','2×/j','3×/j','Matin','Soir','Matin + Soir','Si besoin'];
  const DUR_QUICK  = ['3 jours','5 jours','7 jours','10 jours','14 jours','1 mois','3 mois','6 mois','Long terme'];

  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [date, setDate] = useState(toDateStr());
  const [notes, setNotes] = useState('');
  const [meds, setMeds]   = useState([]);
  const [medQ, setMedQ]   = useState('');
  const [medSel, setMedSel]= useState(null);
  const [medDose, setMedDose]= useState('');
  const [medFreq, setMedFreq]= useState('');
  const [medDur, setMedDur]= useState('');
  const [medQte, setMedQte]= useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // specific fields
  const [nbJours, setNbJours] = useState('');
  const [motif, setMotif]   = useState('');
  const [sport, setSport]   = useState('');
  const [etabl, setEtabl]   = useState('');
  const [dest, setDest]     = useState('');
  const [renouvMois, setRenouvMois]= useState('3');
  const [diagnostic, setDiag]= useState('');
  const [analyses, setAnalyses]= useState('');
  const [typeRadio, setTypeRadio]= useState('');
  const [zone, setZone]     = useState('');
  const [bilanSel, setBilanSel] = useState([]);

  const selPatient = patients.find(p=>p.id===Number(patientId));
  const displayName = selPatient ? `${selPatient.firstName} ${selPatient.lastName}` : patientName;

  const filteredMeds = (dropdownOpen && medQ.length>1) ? allMeds.filter(m=>m.nom.toLowerCase().includes(medQ.toLowerCase())||m.dci.toLowerCase().includes(medQ.toLowerCase())).slice(0,6) : [];

  const addMed = () => {
    if(!medSel) return;
    setMeds(ms=>[...ms,{name:medSel.nom,dci:medSel.dci,dose:medDose||medSel.dosage,freq:medFreq||medSel.posologie,dur:medDur,qte:medQte}]);
    setMedSel(null);setMedQ('');setMedDose('');setMedFreq('');setMedDur('');setMedQte('');setDropdownOpen(false);
  };

  const showMeds  = tpl.id==='ordonnance'||tpl.id==='renouvellement';
  const showArret = tpl.id==='arret_travail';
  const showSport = tpl.id==='cert_sport';
  const showEcole = tpl.id==='cert_ecole';
  const showVoyage= tpl.id==='cert_voyage';
  const showCR    = tpl.id==='compte_rendu';
  const showAnal  = tpl.id==='demande_analyse';
  const showRadio = tpl.id==='demande_radio';
  const showBilan = tpl.id==='demande_bilan';
  const toggleTest = (test) => setBilanSel(s => s.includes(test) ? s.filter(t=>t!==test) : [...s, test]);

  const handlePrint = () => {
    const dateStr = new Date(date).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
    const s = settings;
    const dr     = s.doctorName   || 'Dr. ___';
    const drAr   = s.doctorNameAr || '';
    const spec   = s.specialty    || '';
    const spec2  = s.specialty2   || '';
    const specAr = s.specialtyAr  || '';
    const ordre  = s.orderNum     || '';
    const addr   = s.address      || '';
    const addrAr = s.addressAr    || '';
    const city   = s.city         || 'Oum El Bouaghi';
    const cityAr = s.cityAr       || '';
    const tel    = s.phone        || '';
    const hasAr  = !!(drAr || specAr || addrAr);

    // ── En-tête bilingue identique aux vrais tampons ─────────
    const header = `
      <table style="width:100%;border-bottom:3px double #003399;padding-bottom:14px;margin-bottom:8px;border-collapse:collapse">
        <tr>
          <td style="width:${hasAr?'54':'100'}%;vertical-align:top;padding-right:12px">
            <div style="font-weight:bold;font-size:16px;color:#003399;letter-spacing:.02em">${dr}</div>
            ${spec  ? `<div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;text-decoration:underline;margin-top:2px">${spec}</div>` : ''}
            ${spec2 ? `<div style="font-size:12px;font-weight:600;text-transform:uppercase">${spec2}</div>` : ''}
            ${ordre ? `<div style="font-size:11px;margin-top:5px">N° d'Ordre : <strong>${ordre}</strong></div>` : ''}
            ${addr  ? `<div style="font-size:11px">${addr}</div>` : ''}
            ${city  ? `<div style="font-size:11px">${city}</div>` : ''}
            ${tel   ? `<div style="font-size:11px">Tél : ${tel}</div>` : ''}
          </td>
          ${hasAr ? `
          <td style="width:46%;vertical-align:top;text-align:right;direction:rtl;padding-left:12px;font-family:'Cairo','Arial',sans-serif">
            ${drAr   ? `<div style="font-weight:bold;font-size:16px;color:#003399">${drAr}</div>` : ''}
            ${specAr ? `<div style="font-size:12px;font-weight:700;text-decoration:underline;margin-top:2px">${specAr}</div>` : ''}
            ${addrAr ? `<div style="font-size:11px;margin-top:5px">${addrAr}</div>` : ''}
            ${cityAr ? `<div style="font-size:11px">${cityAr}</div>` : ''}
          </td>` : ''}
        </tr>
      </table>
      <div style="text-align:right;font-size:12px;margin:8px 0 4px">
        <em>${city}, le : <span style="display:inline-block;min-width:180px;border-bottom:1px solid #333">&nbsp;${dateStr}&nbsp;</span></em>
      </div>`;

    // ── Ligne Nom du Malade / Age ─────────────────────────────
    // Toujours affichée pour ordonnance, bilan, analyses, radio — avec pointillés si vide
    const nameVal = displayName || '...................................................................';
    const ageVal  = selPatient?.age ? `${selPatient.age} ans` : '................';
    const patLine = `<div style="margin:10px 0 6px;font-size:13px;font-style:italic">
      <strong>Nom du Malade :</strong>
      <span style="display:inline-block;min-width:260px;border-bottom:1px dotted #333">&nbsp;${nameVal}&nbsp;</span>
      &nbsp;&nbsp;&nbsp;
      <strong>Age :</strong>
      <span style="display:inline-block;min-width:60px;border-bottom:1px dotted #333">&nbsp;${ageVal}&nbsp;</span>
    </div>`;

    // patLine apparaît AVANT le titre pour ordonnance/bilan/analyses/radio
    // Pour les certificats : le nom est dans le corps du texte
    const patLineBeforeTitle = showMeds || showBilan || showAnal || showRadio;

    let body = '';

    // ── Ordonnance / Renouvellement ───────────────────────────
    if(showMeds) {
      const medsHtml = meds.length > 0
        ? meds.map((m,i)=>`
            <div style="padding:10px 14px;margin:10px 0;border-left:4px solid #003399;background:#f8f9ff">
              <div style="font-size:14px;font-weight:bold;color:#111">${i+1}. ${m.name} <span style="font-size:13px;color:#555;font-weight:normal">${m.dose||''}</span>
                ${m.qte ? `<span style="font-size:12px;color:#006633;font-weight:bold;margin-left:10px">Qté : ${m.qte} boîte${Number(m.qte)>1?'s':''}</span>` : ''}
              </div>
              ${m.freq ? `<div style="font-size:12px;color:#333;margin-top:3px">${m.freq}${m.dur?` &mdash; ${m.dur}`:''}</div>` : ''}
            </div>`).join('')
        : '<p style="color:#888;font-style:italic;margin-top:20px">Aucun médicament prescrit</p>';
      body = medsHtml;
      if(tpl.id==='renouvellement') body += `<p style="margin-top:14px">Renouvellement pour <strong>${renouvMois} mois</strong>.</p>`;
    }

    // ── Arrêt de travail ──────────────────────────────────────
    if(showArret) body = `
      <p style="margin:18px 0 14px;line-height:1.8">
        Je soussigné, Docteur en Médecine certifie que l'état de santé de<br>
        <strong>M / Mme : <span style="display:inline-block;min-width:280px;border-bottom:1px solid #333">&nbsp;${displayName||''}&nbsp;</span></strong>
      </p>
      <p style="margin-bottom:8px">Numéro de Sécurité Sociale : <span style="display:inline-block;min-width:200px;border-bottom:1px dotted #555">&nbsp;</span></p>
      <div style="margin:12px 0;line-height:2">
        <p><strong>(1)</strong> Nécessite un Traitement avec Arrêt de Travail de :
          <strong>&nbsp;${nbJours||'..........'}&nbsp;</strong> Jours, sauf Complication<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;à dater du : <span style="display:inline-block;min-width:100px;border-bottom:1px dotted #555">&nbsp;</span>
          au : <span style="display:inline-block;min-width:100px;border-bottom:1px dotted #555">&nbsp;</span>
        </p>
        <p><strong>(2)</strong> Nécessite une prolongation d'Arrêt de travail de :
          <span style="display:inline-block;min-width:80px;border-bottom:1px dotted #555">&nbsp;</span> Jours, sauf Complication<br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;à dater du : <span style="display:inline-block;min-width:100px;border-bottom:1px dotted #555">&nbsp;</span>
          au : <span style="display:inline-block;min-width:100px;border-bottom:1px dotted #555">&nbsp;</span>
        </p>
        <p><strong>(3)</strong> Nécessite un arrêt scolaire de :
          <span style="display:inline-block;min-width:60px;border-bottom:1px dotted #555">&nbsp;</span> jours
          à dater du : <span style="display:inline-block;min-width:80px;border-bottom:1px dotted #555">&nbsp;</span>
          au : <span style="display:inline-block;min-width:80px;border-bottom:1px dotted #555">&nbsp;</span><br>
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;une IPP de : <span style="display:inline-block;min-width:60px;border-bottom:1px dotted #555">&nbsp;</span> (pour cent)
        </p>
        <p><strong>(4)</strong> Lui permet de reprendre son travail ou ses cours du :
          <span style="display:inline-block;min-width:180px;border-bottom:1px dotted #555">&nbsp;</span>
        </p>
      </div>
      ${motif ? `<p style="margin-top:10px;font-style:italic">Motif médical : ${motif}</p>` : ''}`;

    // ── Certificat de santé ───────────────────────────────────
    if(tpl.id==='cert_sante') body = `
      <p style="text-align:justify;line-height:2.2;margin:24px 0">
        Je soussigné docteur en Médecine Général Certifie avoir examiné ce jour
        le (la) nommé(e) <strong><span style="display:inline-block;min-width:220px;border-bottom:1px solid #333">&nbsp;${displayName||''}&nbsp;</span></strong>
        et avoir constaté qu'il est indemne de toute maladie contagieuse et de toute affection pulmonaire.
      </p>
      <p style="text-align:justify;line-height:2">
        le présent certificat lui est délivré pour servir &amp; valoir ce que de droit.
      </p>`;

    if(showSport) body = `<p style="text-align:justify;line-height:2;margin:20px 0">
        Je soussigné(e) <strong>${dr}</strong>, certifie qu'il n'existe pas de contre-indication médicale à la pratique de
        <strong>${sport||"l'activité sportive"}</strong> pour <strong>${displayName||'___'}</strong> à la date du ${dateStr}.
      </p>`;

    if(showEcole) body = `<p style="text-align:justify;line-height:2;margin:20px 0">
        Je soussigné(e) <strong>${dr}</strong>, certifie que <strong>${displayName||'___'}</strong>
        peut être admis(e) à l'établissement <strong>${etabl||'___'}</strong>.
        Bon état de santé général constaté le ${dateStr}.
      </p>`;

    if(showVoyage) body = `<p style="text-align:justify;line-height:2;margin:20px 0">
        Je soussigné(e) <strong>${dr}</strong>, certifie que <strong>${displayName||'___'}</strong>
        est apte à effectuer un voyage vers <strong>${dest||'___'}</strong>. Constaté le ${dateStr}.
      </p>`;

    if(showCR) body = `
      <div style="padding:12px;border:1px solid #ddd;border-radius:6px;margin:12px 0">
        <strong>Diagnostic :</strong> ${diagnostic||'—'}<br><br>
        <div style="white-space:pre-wrap;line-height:1.8">${notes||''}</div>
      </div>`;

    if(showAnal) body = `
      <p style="margin-top:16px"><strong>Analyses demandées :</strong></p>
      <div style="white-space:pre-wrap;padding:12px;background:#f8f9ff;border-left:3px solid #003399;margin-top:8px;line-height:2;font-size:13px">${analyses||'—'}</div>`;

    if(showRadio) body = `
      <p style="margin-top:16px"><strong>Examen demandé :</strong> <span style="display:inline-block;min-width:200px;border-bottom:1px solid #333">&nbsp;${typeRadio||''}&nbsp;</span></p>
      <p style="margin-top:10px"><strong>Zone anatomique :</strong> <span style="display:inline-block;min-width:200px;border-bottom:1px solid #333">&nbsp;${zone||''}&nbsp;</span></p>`;

    // ── Bilan biologique ──────────────────────────────────────
    if(showBilan) {
      const selected = bilanSel;
      const half = Math.ceil(BILAN_TESTS.length / 2);
      const left  = BILAN_TESTS.slice(0, half);
      const right = BILAN_TESTS.slice(half);
      const testRow = (t) => {
        const checked = selected.includes(t);
        return `<div style="display:flex;align-items:center;gap:6px;padding:4px 2px;font-size:12px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border:1.5px solid #003399;border-radius:2px;flex-shrink:0;font-size:11px;font-weight:bold;color:#003399">${checked?'✓':''}</span>
          <span style="font-weight:${checked?'bold':'normal'}">${t}</span>
        </div>`;
      };
      body = `
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:20px;border-right:1px solid #ccc">
              ${left.map(testRow).join('')}
            </td>
            <td style="width:50%;vertical-align:top;padding-left:20px">
              ${right.map(testRow).join('')}
            </td>
          </tr>
        </table>`;
    }

    if(!body) body = `<p style="white-space:pre-wrap;line-height:1.8">${notes||''}</p>`;
    if(notes && !showCR && !showAnal && !showRadio && !showBilan && !showMeds) {
      body += `<br><p style="color:#555;font-style:italic;font-size:12px">Notes : ${notes}</p>`;
    }

    // ── Titre centré, gras, souligné ─────────────────────────
    const titleHtml = showBilan
      ? `<div style="text-align:center;margin:18px 0 14px">
           <div style="font-size:24px;font-weight:bold;letter-spacing:.12em;color:#003399">BILAN</div>
           <div style="font-size:13px;font-style:italic;margin-top:4px">— Prière de faire —</div>
         </div>`
      : `<h3 style="text-align:center;font-size:17px;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;margin:18px 0 14px;border-bottom:2px solid #003399;padding-bottom:8px;color:#111">${tpl.name}</h3>`;

    const footer = `<div style="margin-top:50px;display:flex;justify-content:flex-end">
      <div style="text-align:center;min-width:180px;border-top:1px solid #333;padding-top:8px;font-size:12px">Signature &amp; Cachet</div>
    </div>`;

    // ── Assemblage final ──────────────────────────────────────
    const htmlBody = patLineBeforeTitle
      ? `${patLine}${titleHtml}${body}`
      : `${titleHtml}${body}`;

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${tpl.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
        body{font-family:Arial,sans-serif;padding:32px 40px;max-width:720px;margin:auto;color:#111;font-size:13px;}
        p{margin:6px 0;line-height:1.7;}
        @media print{body{padding:18px 28px;}@page{margin:1cm;}}
      </style>
    </head><body>${header}${htmlBody}${footer}</body></html>`;

    // Impression via iframe caché (fonctionne dans Electron et navigateur)
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:0;height:0;border:none;opacity:0;';
    document.body.appendChild(iframe);
    iframe.srcdoc = html;
    setTimeout(() => {
      try { iframe.contentWindow?.print(); } catch(e) { console.error('Print error', e); }
      setTimeout(() => { if(document.body.contains(iframe)) document.body.removeChild(iframe); }, 3000);
    }, 600);

    if(selPatient?.id) {
      addDocument({ patientId:selPatient.id, type:tpl.name, title:`${tpl.name} — ${date}`, date, notes });
    }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
      <Card>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.textSub, fontSize:13 }}>← Retour</button>
          <div style={{ width:36, height:36, borderRadius:10, background:`${tpl.color}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{tpl.icon}</div>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:16, color:T.text }}>{tpl.name}</div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 160px', gap:12, marginBottom:16 }}>
          <div>
            <select className="input-base" value={patientId} onChange={e=>{setPatientId(e.target.value);setPatientName('');}} style={{ marginBottom:6 }}>
              <option value="">Sélectionner un patient…</option>
              {patients.map(p=><option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
              <option value="__new__">Nom libre</option>
            </select>
            {(patientId==='__new__'||patients.length===0)&&(
              <input className="input-base" value={patientName} onChange={e=>setPatientName(e.target.value)} placeholder="Nom du patient" />
            )}
          </div>
          <div><label style={{ fontSize:12, color:T.textSub, display:'block', marginBottom:6 }}>Date</label><input type="date" className="input-base" value={date} onChange={e=>setDate(e.target.value)} /></div>
        </div>

        {/* Ordonnance / Renouvellement */}
        {showMeds&&(
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:T.textSub, fontWeight:600, marginBottom:10 }}>Médicaments</div>
            <div style={{ position:'relative', marginBottom:8 }}>
              <input className="input-base" value={medQ} onChange={e=>{setMedQ(e.target.value);setMedSel(null);setDropdownOpen(true);}} placeholder="Rechercher un médicament..." />
              {filteredMeds.length>0&&(
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, zIndex:99, boxShadow:'0 8px 24px rgba(0,0,0,0.4)', overflow:'hidden' }}>
                  {filteredMeds.map(m=>(
                    <div key={m.id} className="hover-card" onClick={()=>{setMedSel(m);setMedQ(m.nom);setMedDose(m.dosage);setMedFreq(m.posologie);setDropdownOpen(false);}} style={{ padding:'8px 12px', cursor:'pointer', borderBottom:`1px solid ${T.border}` }}>
                      <span style={{ fontSize:12, fontWeight:600, color:T.text }}>{m.nom}</span> <span style={{ fontSize:11, color:T.purple }}>{m.dosage}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {medSel&&(
              <div style={{ background:`${T.purple}0a`, border:`1px solid ${T.purple}33`, borderRadius:10, padding:12, marginBottom:10 }}>
                {/* Dose + Qté */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 120px', gap:8, marginBottom:8 }}>
                  <div>
                    <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Dosage</label>
                    <input className="input-base" value={medDose} onChange={e=>setMedDose(e.target.value)} placeholder={medSel.dosage} style={{ fontSize:12 }} />
                  </div>
                  <div>
                    <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Qté (boîtes)</label>
                    <input type="number" min="1" className="input-base" value={medQte} onChange={e=>setMedQte(e.target.value)} placeholder="1" style={{ fontSize:12 }} />
                  </div>
                </div>
                {/* Quick Fréquence */}
                <div style={{ marginBottom:8 }}>
                  <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Fréquence</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                    {FREQ_QUICK.map(f=>(
                      <button key={f} onClick={()=>setMedFreq(f)} style={{ fontSize:11, padding:'3px 9px', borderRadius:6, cursor:'pointer', border:`1px solid ${medFreq===f?T.purple:T.border}`, background:medFreq===f?T.purple:T.card, color:medFreq===f?'#fff':T.textSub, transition:'all 0.15s' }}>{f}</button>
                    ))}
                  </div>
                  <input className="input-base" value={medFreq} onChange={e=>setMedFreq(e.target.value)} placeholder="Ou saisir manuellement..." style={{ fontSize:12 }} />
                </div>
                {/* Quick Durée */}
                <div style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, color:T.textMuted, display:'block', marginBottom:4 }}>Durée</label>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:4, marginBottom:6 }}>
                    {DUR_QUICK.map(d=>(
                      <button key={d} onClick={()=>setMedDur(d)} style={{ fontSize:11, padding:'3px 9px', borderRadius:6, cursor:'pointer', border:`1px solid ${medDur===d?T.teal:T.border}`, background:medDur===d?T.teal:T.card, color:medDur===d?'#000':T.textSub, transition:'all 0.15s' }}>{d}</button>
                    ))}
                  </div>
                  <input className="input-base" value={medDur} onChange={e=>setMedDur(e.target.value)} placeholder="Ou saisir manuellement..." style={{ fontSize:12 }} />
                </div>
                <button onClick={addMed} style={{ width:'100%', background:T.purple, border:'none', borderRadius:7, padding:'9px', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <span style={{ fontSize:16, lineHeight:1 }}>+</span> Ajouter à l'ordonnance
                </button>
              </div>
            )}
            {meds.map((m,i)=>(
              <div key={i} style={{ display:'flex', gap:10, padding:10, background:`${T.purple}0d`, border:`1px solid ${T.purple}33`, borderRadius:8, marginBottom:6 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.text }}>{i+1}. {m.name} <span style={{ color:T.purple }}>{m.dose}</span>{m.qte&&<span style={{ fontSize:11, color:T.teal, marginLeft:6 }}>• {m.qte} boîte{m.qte>1?'s':''}</span>}</div>
                  <div style={{ fontSize:11, color:T.textMuted }}>{m.freq}{m.dur?` — ${m.dur}`:''}</div>
                </div>
                <button onClick={()=>setMeds(ms=>ms.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', cursor:'pointer', color:T.red }}>✕</button>
              </div>
            ))}
            {tpl.id==='renouvellement'&&(
              <div style={{ marginTop:10 }}><label style={{ fontSize:12, color:T.textSub, display:'block', marginBottom:6 }}>Durée du renouvellement</label>
                <select className="input-base" value={renouvMois} onChange={e=>setRenouvMois(e.target.value)} style={{ width:160 }}>
                  {['1','2','3','6','12'].map(m=><option key={m} value={m}>{m} mois</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {showArret&&(
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <Field label="Nombre de jours"><input type="number" className="input-base" value={nbJours} onChange={e=>setNbJours(e.target.value)} placeholder="Ex: 3" /></Field>
            <Field label="Motif médical"><input className="input-base" value={motif} onChange={e=>setMotif(e.target.value)} placeholder="Motif" /></Field>
          </div>
        )}
        {showSport&&<Field label="Activité sportive" style={{ marginBottom:16 }}><input className="input-base" value={sport} onChange={e=>setSport(e.target.value)} placeholder="Football, natation, arts martiaux..." /></Field>}
        {showEcole&&<Field label="Établissement scolaire" style={{ marginBottom:16 }}><input className="input-base" value={etabl} onChange={e=>setEtabl(e.target.value)} placeholder="Nom de l'école ou université..." /></Field>}
        {showVoyage&&<Field label="Destination" style={{ marginBottom:16 }}><input className="input-base" value={dest} onChange={e=>setDest(e.target.value)} placeholder="Ex: France, Turquie..." /></Field>}
        {showCR&&<Field label="Diagnostic / Compte rendu" style={{ marginBottom:16 }}><textarea rows={4} className="input-base" value={diagnostic} onChange={e=>setDiag(e.target.value)} style={{ resize:'vertical' }} /></Field>}
        {showAnal&&<Field label="Analyses demandées" style={{ marginBottom:16 }}><textarea rows={4} className="input-base" value={analyses} onChange={e=>setAnalyses(e.target.value)} placeholder="NFS, glycémie, bilan lipidique..." style={{ resize:'vertical' }} /></Field>}

        {showBilan&&(
          <div style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:12, color:T.textSub, fontWeight:600 }}>
                Tests à demander — {bilanSel.length} sélectionné(s)
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>setBilanSel([...BILAN_TESTS])} style={{ fontSize:11, padding:'3px 10px', borderRadius:6, background:T.tealDim, border:`1px solid ${T.borderAccent}`, color:T.teal, cursor:'pointer' }}>Tout sélectionner</button>
                <button onClick={()=>setBilanSel([])} style={{ fontSize:11, padding:'3px 10px', borderRadius:6, background:T.card, border:`1px solid ${T.border}`, color:T.textSub, cursor:'pointer' }}>Tout effacer</button>
              </div>
            </div>
            <div style={{ columns:2, columnGap:16, background:T.card, border:`1px solid ${T.border}`, borderRadius:10, padding:14 }}>
              {BILAN_TESTS.map(test=>(
                <div key={test} onClick={()=>toggleTest(test)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 6px', borderRadius:6, cursor:'pointer', marginBottom:2, background:bilanSel.includes(test)?T.tealDim:'transparent', breakInside:'avoid' }}>
                  <div style={{ width:16, height:16, borderRadius:3, border:`2px solid ${bilanSel.includes(test)?T.teal:T.border}`, background:bilanSel.includes(test)?T.teal:'transparent', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {bilanSel.includes(test)&&<span style={{ color:'#000', fontSize:11, fontWeight:700, lineHeight:1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:12, color:bilanSel.includes(test)?T.teal:T.text }}>{test}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showRadio&&(
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            <Field label="Type d'examen"><input className="input-base" value={typeRadio} onChange={e=>setTypeRadio(e.target.value)} placeholder="Radio, Echo, Scanner, IRM..." /></Field>
            <Field label="Zone anatomique"><input className="input-base" value={zone} onChange={e=>setZone(e.target.value)} placeholder="Thorax, abdomen..." /></Field>
          </div>
        )}

        <Field label="Notes / Remarques" style={{ marginBottom:20 }}>
          <textarea rows={3} className="input-base" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Instructions complémentaires..." style={{ resize:'vertical' }} />
        </Field>

        <button onClick={handlePrint} style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:`linear-gradient(135deg,${tpl.color},${T.blue})`, border:'none', borderRadius:10, padding:'12px', cursor:'pointer', color:'#fff', fontWeight:700, fontSize:14 }}>
          🖨️ Imprimer / Enregistrer
        </button>
      </Card>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {selPatient&&(
          <Card style={{ padding:14 }}>
            <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:12, color:T.text, marginBottom:8 }}>Patient</div>
            {[['Nom',`${selPatient.firstName} ${selPatient.lastName}`],['Âge',selPatient.age?`${selPatient.age} ans`:'—'],['Groupe sanguin',selPatient.bloodGroup||'—'],['Allergies',selPatient.allergies||'Aucune']].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:`1px solid ${T.border}` }}>
                <span style={{ fontSize:11, color:T.textMuted }}>{k}</span>
                <span style={{ fontSize:11, color:T.text, fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </Card>
        )}
        <Card style={{ padding:14 }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:12, color:T.text, marginBottom:8 }}>Médicaments favoris</div>
          {allMeds.filter(m=>m.favorite).slice(0,8).map(m=>(
            <div key={m.id} className="hover-card"
              onClick={()=>{ if(showMeds){setMedSel(m);setMedQ(m.nom);setMedDose(m.dosage);setMedFreq(m.posologie);setMedDur('');setMedQte('');setDropdownOpen(false);} }}
              style={{ display:'flex', justifyContent:'space-between', padding:'6px 8px', borderRadius:7, marginBottom:3, cursor:showMeds?'pointer':'default' }}>
              <span style={{ fontSize:11, color:T.textSub }}>{m.nom} {m.dosage}</span>
              {showMeds&&<Icon name="plus" size={12} color={T.teal} />}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────
const PapierPage = () => {
  const { getPaperTemplates, addPaperTemplate, updatePaperTemplate, deletePaperTemplate } = useApp();
  const [activeTpl, setActiveTpl]   = useState(null);
  const [addModal, setAddModal]     = useState(false);
  const [editTpl, setEditTpl]       = useState(null);
  const [delTpl, setDelTpl]         = useState(null);

  const templates = getPaperTemplates();
  const tpl = templates.find(t=>t.id===activeTpl);

  if (activeTpl && tpl) {
    return <PaperEditor tpl={tpl} onClose={()=>setActiveTpl(null)} />;
  }

  return (
    <div className="fade-up">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:20, color:T.text }}>Papiers médicaux</div>
          <div style={{ fontSize:13, color:T.textMuted, marginTop:4 }}>Cliquez sur un type de document pour le créer</div>
        </div>
        <button className="btn-primary" style={{ fontSize:13, padding:'8px 18px', display:'flex', alignItems:'center', gap:8 }}
          onClick={()=>{setEditTpl(null);setAddModal(true);}}>
          <Icon name="plus" size={14} color="#000" /> Nouveau type de papier
        </button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:16 }}>
        {templates.map(t=>(
          <PaperCard3D key={t.id} tpl={t}
            onClick={()=>setActiveTpl(t.id)}
            onEdit={!t.isDefault?()=>{setEditTpl(t);setAddModal(true);}:undefined}
            onDelete={!t.isDefault?()=>setDelTpl(t):undefined}
            isDefault={t.isDefault}
          />
        ))}
      </div>

      <TemplateModal key={editTpl?.id||'new'} open={addModal} onClose={()=>{setAddModal(false);setEditTpl(null);}}
        onSave={editTpl?data=>updatePaperTemplate(editTpl.id,data):addPaperTemplate}
        tpl={editTpl} />
      <ConfirmDialog open={!!delTpl} onClose={()=>setDelTpl(null)}
        onConfirm={()=>deletePaperTemplate(delTpl?.id)}
        title="Supprimer ce modèle"
        message={`Supprimer le modèle "${delTpl?.name}" ?`} danger />
    </div>
  );
};

export default PapierPage;
