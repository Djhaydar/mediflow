import { useState } from 'react';
import { T } from '../theme';
import Icon from '../components/Icon';
import { Card, Field, Modal, Toggle } from '../components/UI';
import { useApp } from '../context/AppContext';
import { db, updateDefaultMeds } from '../db/database';

const CATS = [
  { id:'general', key:'settings.tab.general' },
  { id:'display', key:'settings.tab.display' },
  { id:'cabinet', key:'settings.tab.cabinet' },
];

const FONTS = ['Plus Jakarta Sans','Roboto','Open Sans','Lato','Cairo','Tajawal','Inter','Poppins'];
const LANGS = [{ value:'fr', label:'Français 🇫🇷' },{ value:'en', label:'English 🇬🇧' },{ value:'ar', label:'العربية 🇩🇿' }];

const Section = ({ title, children }) => (
  <div style={{ marginBottom:24 }}>
    <div style={{ fontSize:11, fontWeight:700, color:T.teal, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>{title}</div>
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{children}</div>
  </div>
);

const Row = ({ label, sub, children }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:T.card, border:`1px solid ${T.border}`, borderRadius:10 }}>
    <div>
      <div style={{ fontSize:13, fontWeight:500, color:T.text }}>{label}</div>
      {sub&&<div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{sub}</div>}
    </div>
    <div>{children}</div>
  </div>
);

// ── Factory Reset Modal ───────────────────────────────────
const ResetModal = ({ open, onClose, t }) => {
  const [confirm, setConfirm] = useState('');
  const doReset = () => {
    if(confirm!=='RESET') return;
    Object.keys(localStorage).filter(k=>k.startsWith('mediflow_')).forEach(k=>localStorage.removeItem(k));
    window.location.reload();
  };
  return (
    <Modal open={open} onClose={()=>{setConfirm('');onClose();}} title="⚠️ Formater l'application" width={420}>
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <div style={{ padding:16, background:T.redDim, border:`1px solid ${T.red}44`, borderRadius:10, fontSize:13, color:T.textSub, lineHeight:1.6 }}>
          Cette action supprimera <strong style={{ color:T.red }}>toutes les données</strong> : patients, RDV, consultations, finances, paramètres. Cette action est irréversible.
        </div>
        <Field label="Tapez RESET pour confirmer">
          <input className="input-base" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="RESET" style={{ border:`1px solid ${confirm==='RESET'?T.red:T.border}` }} />
        </Field>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={()=>{setConfirm('');onClose();}}>{t('btn.cancel')}</button>
          <button disabled={confirm!=='RESET'} onClick={doReset} style={{ background:confirm==='RESET'?T.red:'#444', color:'#fff', border:'none', borderRadius:8, padding:'8px 20px', cursor:confirm==='RESET'?'pointer':'not-allowed', fontWeight:600, fontSize:13, opacity:confirm==='RESET'?1:0.5 }}>
            {t('btn.format')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ── Change PIN Modal ──────────────────────────────────────
const PinModal = ({ open, onClose, currentPin, onSave, t }) => {
  const [old, setOld] = useState('');
  const [nw, setNw]   = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr] = useState('');

  const handleSave = () => {
    if(old!==currentPin){setErr('PIN actuel incorrect');return;}
    if(nw.length<4){setErr('PIN minimum 4 chiffres');return;}
    if(nw!==conf){setErr('Les PINs ne correspondent pas');return;}
    onSave(nw); onClose(); setOld('');setNw('');setConf('');setErr('');
  };

  return (
    <Modal open={open} onClose={()=>{onClose();setOld('');setNw('');setConf('');setErr('');}} title="Changer le PIN de sécurité" width={380}>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Field label="PIN actuel"><input type="password" className="input-base" value={old} onChange={e=>setOld(e.target.value)} placeholder="••••" /></Field>
        <Field label="Nouveau PIN"><input type="password" className="input-base" value={nw} onChange={e=>setNw(e.target.value)} placeholder="••••" /></Field>
        <Field label="Confirmer le nouveau PIN"><input type="password" className="input-base" value={conf} onChange={e=>setConf(e.target.value)} placeholder="••••" /></Field>
        {err&&<div style={{ fontSize:12, color:T.red, padding:'8px 12px', background:T.redDim, borderRadius:7 }}>{err}</div>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:4 }}>
          <button className="btn-ghost" onClick={onClose}>{t('btn.cancel')}</button>
          <button className="btn-primary" onClick={handleSave}>{t('btn.save')}</button>
        </div>
      </div>
    </Modal>
  );
};

// ── Médicaments Import Modal ──────────────────────────────
const MedImportModal = ({ open, onClose, t }) => {
  const [status, setStatus] = useState('');
  const handleFile = (e) => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try {
        const data=JSON.parse(ev.target.result);
        if(!Array.isArray(data)) throw new Error();
        db.set('medications', data);
        setStatus(`✅ ${data.length} médicaments importés.`);
      } catch { setStatus('❌ Fichier invalide. JSON array attendu.'); }
    };
    reader.readAsText(file);
  };
  return (
    <Modal open={open} onClose={onClose} title="Importer base de médicaments" width={420}>
      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ fontSize:13, color:T.textSub, lineHeight:1.6 }}>Importez un fichier JSON contenant un tableau de médicaments. Cela remplacera la base actuelle.</div>
        <div style={{ border:`2px dashed ${T.border}`, borderRadius:10, padding:24, textAlign:'center', cursor:'pointer' }} onClick={()=>document.getElementById('medImport').click()}>
          <input id="medImport" type="file" accept=".json" style={{ display:'none' }} onChange={handleFile} />
          <div style={{ fontSize:24, marginBottom:8 }}>📂</div>
          <div style={{ fontSize:13, color:T.textMuted }}>Sélectionner un fichier .json</div>
        </div>
        {status&&<div style={{ fontSize:13, padding:12, background:status.startsWith('✅')?T.tealDim:T.redDim, borderRadius:8, color:T.text }}>{status}</div>}
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button className="btn-ghost" onClick={onClose}>{t('btn.cancel')}</button>
        </div>
      </div>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════
const SettingsPage = () => {
  const { getSettings, updateSettings, t } = useApp();
  const [cat, setCat]          = useState('general');
  const [resetModal, setReset] = useState(false);
  const [pinModal, setPinModal]= useState(false);
  const [medModal, setMedModal]= useState(false);
  const s = getSettings();

  // Local state for cabinet text fields — saves on blur, no re-render per keystroke
  const [cabinet, setCabinet] = useState({
    doctorName:     s.doctorName     || '',
    doctorInitials: s.doctorInitials || '',
    doctorNameAr:   s.doctorNameAr   || '',
    specialty:      s.specialty      || '',
    specialty2:     s.specialty2     || '',
    specialtyAr:    s.specialtyAr    || '',
    orderNum:       s.orderNum       || '',
    cabinetName:    s.cabinetName    || '',
    address:        s.address        || '',
    city:           s.city           || '',
    addressAr:      s.addressAr      || '',
    cityAr:         s.cityAr         || '',
    phone:          s.phone          || '',
  });

  const upd   = (k, v) => updateSettings({ [k]:v });
  const setCab = (k, v) => setCabinet(f => ({ ...f, [k]:v }));
  const saveCab = (k) => updateSettings({ [k]: cabinet[k] });

  const exportDB = () => {
    const data = {};
    ['patients','rdv','consultations','documents','medications','finance','settings','paperTemplates'].forEach(tbl=>{
      data[tbl] = db.get(tbl);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href=url; a.download=`mediflow-backup-${new Date().toISOString().slice(0,10)}.json`; a.click();
  };

  const importDB = (e) => {
    const file=e.target.files[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      try {
        const data=JSON.parse(ev.target.result);
        Object.entries(data).forEach(([tbl,d])=>db.set(tbl,d));
        window.location.reload();
      } catch { alert('Fichier invalide'); }
    };
    reader.readAsText(file);
  };

  const inputSm  = { fontSize:13, padding:'6px 10px', borderRadius:7, background:T.card, border:`1px solid ${T.border}`, color:T.text, outline:'none' };
  const inputCab = { ...inputSm, minWidth:180 };

  return (
    <div style={{ display:'flex', gap:16 }} className="fade-up">
      {/* Left nav */}
      <div style={{ width:180, flexShrink:0 }}>
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:14, padding:10 }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:14, color:T.text, padding:'6px 6px 12px', borderBottom:`1px solid ${T.border}`, marginBottom:8 }}>
            {t('nav.settings')}
          </div>
          {CATS.map(c=>(
            <button key={c.id} onClick={()=>setCat(c.id)} style={{ textAlign:'left', width:'100%', background:cat===c.id?T.tealDim:'transparent', border:`1px solid ${cat===c.id?T.borderAccent:'transparent'}`, borderRadius:8, padding:'9px 10px', cursor:'pointer', color:cat===c.id?T.teal:T.textSub, fontSize:13, fontWeight:cat===c.id?600:400, marginBottom:2 }}>
              {t(c.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex:1 }}>

        {/* ── GÉNÉRAL ── */}
        {cat==='general'&&(
          <div>
            <Section title={t('settings.sec.language')}>
              <Row label={t('lbl.language')} sub={t('lbl.langSub')}>
                <select style={inputSm} value={s.language||'fr'} onChange={e=>upd('language',e.target.value)}>
                  {LANGS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </Row>
            </Section>

            <Section title={t('settings.sec.backup')}>
              <Toggle label={t('lbl.autoBackup')} sub={t('lbl.autoBackupSub')} value={s.autoBackup||false} onChange={v=>upd('autoBackup',v)} />
              {s.autoBackup&&(
                <Row label={t('lbl.backupFreq')}>
                  <select style={inputSm} value={s.backupFreq||'semaine'} onChange={e=>upd('backupFreq',e.target.value)}>
                    <option value="jour">{t('freq.day')}</option>
                    <option value="semaine">{t('freq.week')}</option>
                  </select>
                </Row>
              )}
              <Row label={t('lbl.exportDB')} sub={t('lbl.exportSub')}>
                <button onClick={exportDB} style={{ background:T.tealDim, border:`1px solid ${T.borderAccent}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:T.teal, fontWeight:600 }}>
                  {t('btn.export')}
                </button>
              </Row>
              <Row label={t('lbl.importDB')} sub={t('lbl.importSub')}>
                <div>
                  <input id="importDB" type="file" accept=".json" style={{ display:'none' }} onChange={importDB} />
                  <button onClick={()=>document.getElementById('importDB').click()} style={{ background:T.blueDim, border:`1px solid ${T.blue}44`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:T.blue, fontWeight:600 }}>
                    {t('btn.import')}
                  </button>
                </div>
              </Row>
            </Section>

            <Section title={t('settings.sec.security')}>
              <Row label={t('lbl.pin')} sub={`PIN : ${'•'.repeat((s.privatePin||'1234').length)}`}>
                <button onClick={()=>setPinModal(true)} style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:T.textSub, fontWeight:500 }}>
                  {t('btn.pin')}
                </button>
              </Row>
            </Section>

            <Section title={t('settings.sec.notifications')}>
              <Toggle label={t('lbl.notifications')} sub={t('lbl.notifSub')} value={s.notifications!==false} onChange={v=>upd('notifications',v)} />
            </Section>

            <Section title={t('settings.sec.printer')}>
              <Row label={t('lbl.printer')}>
                <input style={inputSm} value={s.printerName||''} onChange={e=>upd('printerName',e.target.value)} placeholder={t('ph.printer')} />
              </Row>
              <Row label={t('lbl.paperFormat')}>
                <select style={inputSm} value={s.printerFormat||'A4'} onChange={e=>upd('printerFormat',e.target.value)}>
                  {['A4','A5','A3','Letter','Legal'].map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </Row>
            </Section>

            {/* ── Mises à jour (Electron uniquement) ── */}
            {window.electronAPI && (
              <Section title="Mises à jour">
                <Row label="Vérifier les mises à jour" sub="Cherche une nouvelle version disponible">
                  <button onClick={()=>{
                    window.electronAPI.checkUpdates();
                    setTimeout(()=>alert('✅ Vérification effectuée. Si une mise à jour est disponible, elle s\'affichera en bas à droite.'), 4000);
                  }} style={{ background:T.tealDim, border:`1px solid ${T.borderAccent}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:T.teal, fontWeight:600 }}>
                    🔄 Vérifier maintenant
                  </button>
                </Row>
                <Row label="Version installée" sub="MediFlow Desktop">
                  <span style={{ fontSize:13, fontWeight:700, color:T.teal, cursor:'default' }}
                    ref={el => { if(el) window.electronAPI.getVersion().then(v => { if(el) el.textContent = `v${v}`; }); }}>
                    —
                  </span>
                </Row>
              </Section>
            )}

            <Section title={t('settings.sec.reset')}>
              <div style={{ padding:'14px 16px', background:T.redDim, border:`1px solid ${T.red}44`, borderRadius:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:T.red }}>{t('lbl.factoryReset')}</div>
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>{t('lbl.factoryResetSub')}</div>
                </div>
                <button onClick={()=>setReset(true)} style={{ background:T.red, color:'#fff', border:'none', borderRadius:8, padding:'7px 16px', cursor:'pointer', fontWeight:600, fontSize:12 }}>
                  {t('btn.format')}
                </button>
              </div>
            </Section>
          </div>
        )}

        {/* ── AFFICHAGE ── */}
        {cat==='display'&&(
          <div>
            <Section title={t('settings.sec.theme')}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[['dark'],['light']].map(([val])=>(
                  <div key={val} onClick={()=>upd('theme',val)} style={{ padding:'20px', borderRadius:12, textAlign:'center', cursor:'pointer', background:(s.theme||'dark')===val?T.tealDim:T.card, border:`2px solid ${(s.theme||'dark')===val?T.teal:T.border}`, transition:'all 0.2s' }}>
                    <div style={{ fontSize:28, marginBottom:8 }}>{val==='dark'?'🌙':'☀️'}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:(s.theme||'dark')===val?T.teal:T.text }}>{t(`theme.${val}`)}</div>
                    {(s.theme||'dark')===val&&<div style={{ fontSize:10, color:T.teal, marginTop:4 }}>{t('theme.active')}</div>}
                  </div>
                ))}
              </div>
            </Section>

            <Section title={t('settings.sec.typography')}>
              <Row label={t('font.size')}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <button onClick={()=>upd('fontSize',Math.max(11,Number(s.fontSize||14)-1))} style={{ width:28, height:28, borderRadius:7, background:T.card, border:`1px solid ${T.border}`, cursor:'pointer', color:T.text, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
                  <span style={{ fontSize:13, color:T.text, fontWeight:600, minWidth:30, textAlign:'center' }}>{s.fontSize||14}px</span>
                  <button onClick={()=>upd('fontSize',Math.min(20,Number(s.fontSize||14)+1))} style={{ width:28, height:28, borderRadius:7, background:T.card, border:`1px solid ${T.border}`, cursor:'pointer', color:T.text, fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
                </div>
              </Row>
              <Row label={t('font.family')}>
                <select style={{ ...inputSm, fontFamily:s.fontFamily||'Plus Jakarta Sans' }} value={s.fontFamily||'Plus Jakarta Sans'} onChange={e=>upd('fontFamily',e.target.value)}>
                  {FONTS.map(f=><option key={f} value={f} style={{ fontFamily:f }}>{f}</option>)}
                </select>
              </Row>
            </Section>
          </div>
        )}

        {/* ── CABINET ── */}
        {cat==='cabinet'&&(
          <div>
            <Section title={t('settings.sec.doctor')}>
              <Row label="Nom (français)">
                <input style={inputCab} value={cabinet.doctorName} onChange={e=>setCab('doctorName',e.target.value)} onBlur={()=>saveCab('doctorName')} placeholder="Dr. DJERMANE Ammar" />
              </Row>
              <Row label="Nom (عربي)" sub="Affiché sur les papiers">
                <input style={{ ...inputCab, direction:'rtl', fontFamily:'Cairo, sans-serif' }} value={cabinet.doctorNameAr} onChange={e=>setCab('doctorNameAr',e.target.value)} onBlur={()=>saveCab('doctorNameAr')} placeholder="الحكيم عمار جرمان" />
              </Row>
              <Row label={t('lbl.initials')}>
                <input style={{ ...inputSm, width:60, textAlign:'center' }} maxLength={3} value={cabinet.doctorInitials} onChange={e=>setCab('doctorInitials',e.target.value)} onBlur={()=>saveCab('doctorInitials')} placeholder="DA" />
              </Row>
              <Row label="Spécialité principale">
                <input style={inputCab} value={cabinet.specialty} onChange={e=>setCab('specialty',e.target.value)} onBlur={()=>saveCab('specialty')} placeholder="Médecine Générale" />
              </Row>
              <Row label="2ème spécialité" sub="Ex: Mésothérapie">
                <input style={inputCab} value={cabinet.specialty2} onChange={e=>setCab('specialty2',e.target.value)} onBlur={()=>saveCab('specialty2')} placeholder="Mésothérapie" />
              </Row>
              <Row label="Spécialité (عربي)">
                <input style={{ ...inputCab, direction:'rtl', fontFamily:'Cairo, sans-serif' }} value={cabinet.specialtyAr} onChange={e=>setCab('specialtyAr',e.target.value)} onBlur={()=>saveCab('specialtyAr')} placeholder="الطب العام" />
              </Row>
              <Row label="N° d'Ordre">
                <input style={{ ...inputSm, width:100 }} value={cabinet.orderNum} onChange={e=>setCab('orderNum',e.target.value)} onBlur={()=>saveCab('orderNum')} placeholder="1351" />
              </Row>
            </Section>

            <Section title={t('settings.sec.cabinetInfo')}>
              <Row label={t('lbl.cabinetName')}>
                <input style={inputCab} value={cabinet.cabinetName} onChange={e=>setCab('cabinetName',e.target.value)} onBlur={()=>saveCab('cabinetName')} placeholder="Cabinet Médical" />
              </Row>
              <Row label="Adresse (français)">
                <input style={{ ...inputSm, width:280 }} value={cabinet.address} onChange={e=>setCab('address',e.target.value)} onBlur={()=>saveCab('address')} placeholder="01 Cité des 70 Logts Route de Khenchela" />
              </Row>
              <Row label="Adresse (عربي)">
                <input style={{ ...inputSm, width:280, direction:'rtl', fontFamily:'Cairo, sans-serif' }} value={cabinet.addressAr} onChange={e=>setCab('addressAr',e.target.value)} onBlur={()=>saveCab('addressAr')} placeholder="01 حي 70 مسكن طريق خنشلة" />
              </Row>
              <Row label="Ville (français)">
                <input style={inputCab} value={cabinet.city} onChange={e=>setCab('city',e.target.value)} onBlur={()=>saveCab('city')} placeholder="Oum El Bouaghi" />
              </Row>
              <Row label="Ville (عربي)">
                <input style={{ ...inputCab, direction:'rtl', fontFamily:'Cairo, sans-serif' }} value={cabinet.cityAr} onChange={e=>setCab('cityAr',e.target.value)} onBlur={()=>saveCab('cityAr')} placeholder="أم البواقي" />
              </Row>
              <Row label={t('lbl.phone')}>
                <input style={inputCab} value={cabinet.phone} onChange={e=>setCab('phone',e.target.value)} onBlur={()=>saveCab('phone')} placeholder="032-55-86-79" />
              </Row>
            </Section>

            <Section title={t('settings.sec.cabinetUsage')}>
              {[
                ['showOnOrdonnance',   'lbl.showOrdonnance',   'lbl.showOrdSub'   ],
                ['showOnCertificats',  'lbl.showCertificats',  'lbl.showCertSub'  ],
                ['showOnArretTravail', 'lbl.showArretTravail', 'lbl.showArretSub' ],
              ].map(([key,lk,sk])=>(
                <Toggle key={key} label={t(lk)} sub={t(sk)} value={s[key]!==false} onChange={v=>upd(key,v)} />
              ))}
            </Section>

            <Section title={t('settings.sec.medications')}>
              <Row label={t('lbl.totalMeds')} sub={t('lbl.totalMedsSub')}>
                <span style={{ fontSize:14, fontWeight:700, color:T.teal }}>{db.get('medications').length}</span>
              </Row>
              <Row label={t('lbl.updateBase')} sub={t('lbl.updateBaseSub')}>
                <button style={{ background:T.tealDim, border:`1px solid ${T.borderAccent}`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:T.teal, fontWeight:600 }} onClick={()=>{
                  const n = updateDefaultMeds();
                  alert(n > 0 ? `✅ ${n} nouveau(x) médicament(s) ajouté(s) à la base !` : '✅ La base est déjà à jour (aucun ajout nécessaire).');
                  window.location.reload();
                }}>
                  {t('btn.update')}
                </button>
              </Row>
              <Row label={t('lbl.importBase')} sub={t('lbl.importBaseSub')}>
                <button onClick={()=>setMedModal(true)} style={{ background:T.blueDim, border:`1px solid ${T.blue}44`, borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, color:T.blue, fontWeight:600 }}>
                  {t('btn.medImport')}
                </button>
              </Row>
            </Section>
          </div>
        )}
      </div>

      <ResetModal open={resetModal} onClose={()=>setReset(false)} t={t} />
      <PinModal open={pinModal} onClose={()=>setPinModal(false)} currentPin={s.privatePin||'1234'} onSave={pin=>updateSettings({privatePin:pin})} t={t} />
      <MedImportModal open={medModal} onClose={()=>setMedModal(false)} t={t} />
    </div>
  );
};

export default SettingsPage;
