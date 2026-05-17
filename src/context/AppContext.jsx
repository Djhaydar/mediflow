import { createContext, useContext, useState, useCallback } from 'react';
import { db, toDateStr, autoRegisterPatient } from '../db/database';
import { createTranslator, getLocale } from '../i18n';

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [refresh, setRefresh] = useState(0);
  // theme, fontSize, fontFamily held in React state so changes trigger re-renders
  const [theme,      setTheme]      = useState(() => db.getOne('settings')?.theme      || 'dark');
  const [fontSize,   setFontSize]   = useState(() => db.getOne('settings')?.fontSize   || 14);
  const [fontFamily, setFontFamily] = useState(() => db.getOne('settings')?.fontFamily || 'Plus Jakarta Sans');
  const [language,   setLanguage]   = useState(() => db.getOne('settings')?.language   || 'fr');
  const tick = useCallback(() => setRefresh(r => r + 1), []);

  // Patients
  const getPatients   = () => db.get('patients');
  const addPatient    = (p)      => { const r=db.insert('patients',p); tick(); return r; };
  const updatePatient = (id,ch)  => { db.update('patients',id,ch); tick(); };
  const deletePatient = (id)     => {
    db.remove('patients',id);
    db.find('consultations',c=>c.patientId===id).forEach(c=>db.remove('consultations',c.id));
    db.find('documents',d=>d.patientId===id).forEach(d=>db.remove('documents',d.id));
    db.find('rdv',r=>r.patientId===id).forEach(r=>db.remove('rdv',r.id));
    tick();
  };
  const getPatient = (id) => db.findOne('patients',p=>p.id===id);
  const ensurePatient = (name, extra={}) => { const r=autoRegisterPatient(name,extra); tick(); return r; };

  // RDV
  const getRdv      = () => db.get('rdv').sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  const addRdv      = (r)      => { const rec=db.insert('rdv',r); tick(); return rec; };
  const updateRdv   = (id,ch)  => { db.update('rdv',id,ch); tick(); };
  const deleteRdv   = (id)     => { db.remove('rdv',id); tick(); };
  const getTodayRdv = () => db.find('rdv',r=>r.date===toDateStr()).sort((a,b)=>a.time.localeCompare(b.time));

  // Consultations
  const getConsultations      = () => db.get('consultations').sort((a,b)=>b.date.localeCompare(a.date));
  const addConsultation       = (c)      => { const r=db.insert('consultations',c); tick(); return r; };
  const updateConsultation    = (id,ch)  => { db.update('consultations',id,ch); tick(); };
  const getPatientConsultations = (pid)  => db.find('consultations',c=>c.patientId===pid).sort((a,b)=>b.date.localeCompare(a.date));

  // Documents
  const getDocuments        = () => db.get('documents');
  const addDocument         = (d)      => { const r=db.insert('documents',d); tick(); return r; };
  const deleteDocument      = (id)     => { db.remove('documents',id); tick(); };
  const getPatientDocuments = (pid)    => db.find('documents',d=>d.patientId===pid).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));

  // Médicaments
  const getMedications    = () => db.get('medications');
  const addMedication     = (m)      => { const r=db.insert('medications',m); tick(); return r; };
  const updateMedication  = (id,ch)  => { db.update('medications',id,ch); tick(); };
  const deleteMedication  = (id)     => { db.remove('medications',id); tick(); };

  // Finance
  const getFinance    = () => db.get('finance').sort((a,b)=>b.date.localeCompare(a.date));
  const addPayment    = (p)     => { const r=db.insert('finance',p); tick(); return r; };
  const updatePayment = (id,ch) => { db.update('finance',id,ch); tick(); };
  const deletePayment = (id)    => { db.remove('finance',id); tick(); };

  // Paramètres
  const getSettings    = () => db.getOne('settings') || {};
  const updateSettings = (ch) => {
    const s=db.getOne('settings');
    if(s) db.update('settings',s.id,ch); else db.insert('settings',{id:1,...ch});
    if (ch.theme      !== undefined) setTheme(ch.theme);
    if (ch.fontSize   !== undefined) setFontSize(ch.fontSize);
    if (ch.fontFamily !== undefined) setFontFamily(ch.fontFamily);
    if (ch.language   !== undefined) setLanguage(ch.language);
    tick();
  };

  // Paper templates
  const getPaperTemplates    = () => db.get('paperTemplates');
  const addPaperTemplate     = (t)      => { const r=db.insert('paperTemplates',{...t,isDefault:false}); tick(); return r; };
  const updatePaperTemplate  = (id,ch)  => { db.update('paperTemplates',id,ch); tick(); };
  const deletePaperTemplate  = (id)     => {
    const all = db.get('paperTemplates');
    // Comparaison String pour éviter tout problème de type (number vs string)
    const found = all.find(t => String(t.id) === String(id));
    if (!found || found.isDefault) return;
    db.set('paperTemplates', all.filter(t => String(t.id) !== String(id)));
    tick();
  };

  // Stats
  const getStats = () => {
    const consultations = db.get('consultations');
    const rdv           = db.get('rdv');
    const finance       = db.get('finance');
    const today         = toDateStr();
    const thisMonth     = today.slice(0,7);

    // Patients du jour = consultations today + rdv "Consultation terminée" today
    const consultedToday = consultations.filter(c=>c.date===today);
    const rdvDoneToday   = rdv.filter(r=>r.date===today && r.statut==='Consultation terminée');
    const patientNamesToday = new Set([
      ...consultedToday.map(c=>c.patientName||''),
      ...rdvDoneToday.map(r=>r.patientName||''),
    ]);
    patientNamesToday.delete('');

    const monthConsults  = consultations.filter(c=>c.date?.startsWith(thisMonth)).length;
    const todayRevenue   = finance.filter(f=>f.date===today).reduce((s,f)=>s+(f.amount||0),0);
    const monthRevenue   = finance.filter(f=>f.date?.startsWith(thisMonth)).reduce((s,f)=>s+(f.amount||0),0);
    const totalPatients  = db.get('patients').length;

    const monthlyData = [];
    for(let i=5;i>=0;i--){
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const key=d.toISOString().slice(0,7);
      const label=d.toLocaleString('fr-FR',{month:'short'});
      monthlyData.push({
        month: label,
        consultations: consultations.filter(c=>c.date?.startsWith(key)).length,
        revenue: finance.filter(f=>f.date?.startsWith(key)).reduce((s,f)=>s+(f.amount||0),0),
      });
    }

    return {
      todayPatients: patientNamesToday.size,
      monthConsults, todayRevenue, monthRevenue,
      totalPatients, monthlyData,
      todayRdv: rdv.filter(r=>r.date===today).sort((a,b)=>a.time.localeCompare(b.time)),
    };
  };

  const t      = createTranslator(language);
  const locale = getLocale(language);

  return (
    <AppContext.Provider value={{
      refresh, theme, fontSize, fontFamily, language, t, locale,
      getPatients, addPatient, updatePatient, deletePatient, getPatient, ensurePatient,
      getRdv, addRdv, updateRdv, deleteRdv, getTodayRdv,
      getConsultations, addConsultation, updateConsultation, getPatientConsultations,
      getDocuments, addDocument, deleteDocument, getPatientDocuments,
      getMedications, addMedication, updateMedication, deleteMedication,
      getFinance, addPayment, updatePayment, deletePayment,
      getSettings, updateSettings,
      getPaperTemplates, addPaperTemplate, updatePaperTemplate, deletePaperTemplate,
      getStats,
    }}>
      {children}
    </AppContext.Provider>
  );
};
