const PFX = 'mediflow_';

export const db = {
  get:     (t)         => { try { return JSON.parse(localStorage.getItem(PFX+t)||'[]'); } catch { return []; } },
  set:     (t, d)      => localStorage.setItem(PFX+t, JSON.stringify(d)),
  insert:  (t, rec)    => { const d=db.get(t); const r={...rec, id:rec.id||Date.now()+Math.floor(Math.random()*999), createdAt:new Date().toISOString()}; d.push(r); db.set(t,d); return r; },
  update:  (t, id, ch) => { const d=db.get(t); const i=d.findIndex(r=>r.id===id); if(i<0) return null; d[i]={...d[i],...ch,updatedAt:new Date().toISOString()}; db.set(t,d); return d[i]; },
  remove:  (t, id)     => { db.set(t, db.get(t).filter(r=>String(r.id)!==String(id))); },
  find:    (t, fn)     => db.get(t).filter(fn),
  findOne: (t, fn)     => db.get(t).find(fn)||null,
  getOne:  (t)         => { const d=db.get(t); return d[0]||null; },
};

export const toDateStr = (d=new Date()) => {
  const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
};
export const isToday = (s) => s === toDateStr();
export const isThisMonth = (s) => s && s.startsWith(new Date().toISOString().slice(0,7));

export const autoRegisterPatient = (name, extra={}) => {
  if (!name?.trim()) return null;
  const existing = db.findOne('patients', p =>
    `${p.firstName||''} ${p.lastName||''}`.toLowerCase().trim() === name.toLowerCase().trim()
  );
  if (existing) return existing;
  const parts = name.trim().split(' ');
  return db.insert('patients', { firstName: parts[0]||'', lastName: parts.slice(1).join(' ')||parts[0]||'', ...extra });
};

export const updateDefaultMeds = () => {
  const existing = db.get('medications');
  if (existing.length === 0) { db.set('medications', INITIAL_MEDS); return INITIAL_MEDS.length; }
  const existingNames = new Set(existing.map(m => m.nom.toLowerCase().trim()));
  const toAdd = INITIAL_MEDS.filter(m => !existingNames.has(m.nom.toLowerCase().trim()));
  if (toAdd.length > 0) {
    const maxId = existing.reduce((mx, m) => Math.max(mx, Number(m.id)||0), 0);
    const newMeds = toAdd.map((m, i) => ({ ...m, id: maxId + i + 1 }));
    db.set('medications', [...existing, ...newMeds]);
  }
  return toAdd.length;
};

export const initDB = () => {
  if (!localStorage.getItem(PFX+'settings')) {
    db.set('settings', [{
      id:1, doctorName:'Dr. Benali', doctorInitials:'DB', specialty:'Médecin Généraliste',
      specialty2:'', doctorNameAr:'', specialtyAr:'', orderNum:'',
      cabinetName:'Cabinet Médical', phone:'', address:'', city:'', addressAr:'', cityAr:'',
      consultFee:2000, language:'fr', theme:'dark', notifications:true, fontSize:14,
      fontFamily:'Plus Jakarta Sans', privatePin:'1234',
      autoBackup:false, backupFreq:'semaine', printerFormat:'A4',
    }]);
  }
  updateDefaultMeds();
  if (db.get('paperTemplates').length===0) db.set('paperTemplates', DEFAULT_PAPERS);
  // Migration : ajouter le template bilan s'il n'existe pas
  if (!db.findOne('paperTemplates', t => t.id === 'demande_bilan')) {
    db.get('paperTemplates').length > 0 &&
      db.set('paperTemplates', [...db.get('paperTemplates'), BILAN_PAPER]);
  }
};

export const BILAN_TESTS = [
  // Colonne gauche
  'Glycémie à jeun (GAJ)', 'Glycémie post-prandiale (GPP)', 'Hémoglobine glycosylée (HbA1c)',
  'Cholestérol total (CT)', 'HDL Cholestérol (HDLc)', 'LDL Cholestérol (LDLc)',
  'Triglycérides sériques (TG)', 'Urée sanguine', 'Créatinine sanguine',
  'FNS - VS', 'TGO', 'TGP', 'PAL', 'Bilirubine', 'TSHus - T4', 'ECBU',
  'Micro albuminurie des 24h', 'Groupage', 'Électrophorèse des protéines sériques',
  'PSA total', 'PSA libre / PSA total',
  // Colonne droite
  'Sérologie rubéole', 'Sérologie toxoplasmose', 'S.D Widal', 'Sérologie brucellose',
  'CRP - Latex - Waaler - Rose', 'Taux de prothrombine (TP)', 'Fibrinogène',
  'Fer sérique', 'Natrémie (Na+)', 'Kaliémie (K+)', 'Calcémie', 'TCA',
  'Ag HBS - HCV', 'HIV', 'VIT D3', 'D. DIMÈRES', 'FSH - LH',
];

const BILAN_PAPER = { id:'demande_bilan', name:'Bilan biologique', icon:'🧫', color:'#34d399', isDefault:true, fields:['bilan','notes'] };

const DEFAULT_PAPERS = [
  { id:'ordonnance',       name:'Ordonnance',                icon:'💊', color:'#a78bfa', isDefault:true,  fields:['meds','notes'] },
  { id:'arret_travail',    name:"Arrêt de travail",           icon:'🏥', color:'#f87171', isDefault:true,  fields:['nbJours','motif','notes'] },
  { id:'cert_sante',       name:'Certificat médical',         icon:'✅', color:'#00c9a7', isDefault:true,  fields:['notes'] },
  { id:'cert_sport',       name:'Non contre-indication sport',icon:'⚽', color:'#4a7bff', isDefault:true,  fields:['sport','notes'] },
  { id:'cert_ecole',       name:'Certificat scolaire',        icon:'🏫', color:'#60a5fa', isDefault:true,  fields:['etablissement','notes'] },
  { id:'cert_voyage',      name:'Aptitude au voyage',         icon:'✈️', color:'#fbbf24', isDefault:true,  fields:['destination','notes'] },
  { id:'renouvellement',   name:'Renouvellement ordonnance',  icon:'🔄', color:'#4ade80', isDefault:true,  fields:['meds','renouvMois','notes'] },
  { id:'compte_rendu',     name:'Compte rendu médical',       icon:'📋', color:'#f472b6', isDefault:true,  fields:['diagnostic','notes'] },
  BILAN_PAPER,
  { id:'demande_analyse',  name:"Demande d'analyse",          icon:'🧪', color:'#34d399', isDefault:true,  fields:['analyses','notes'] },
  { id:'demande_radio',    name:'Demande de radio/imagerie',  icon:'🔬', color:'#818cf8', isDefault:true,  fields:['typeRadio','zone','notes'] },
];

const INITIAL_MEDS = [
  // ── Antihypertenseurs – Inhibiteurs calciques ─────────────
  { id:1,   nom:'Amlodipine',            dci:'Amlodipine bésilate',                dosage:'5 mg',       forme:'Comprimé',    classe:'Inhibiteur calcique',         posologie:'1×/jour matin',                        indication:'HTA, Angor de poitrine',                        contreIndication:'Choc cardiogénique, grossesse',             favorite:true  },
  { id:20,  nom:'Nifédipine LP',         dci:'Nifédipine',                         dosage:'30 mg',      forme:'Comprimé LP', classe:'Inhibiteur calcique',         posologie:'1-2×/jour',                            indication:'HTA, Angor',                                    contreIndication:'Choc cardiogénique',                        favorite:false },
  { id:21,  nom:'Lercanidipine',         dci:'Lercanidipine chlorhydrate',         dosage:'10 mg',      forme:'Comprimé',    classe:'Inhibiteur calcique',         posologie:'1×/jour avant repas',                  indication:'HTA légère à modérée',                          contreIndication:'Insuffisance cardiaque sévère',             favorite:false },
  // ── Bêtabloquants ─────────────────────────────────────────
  { id:2,   nom:'Bisoprolol',            dci:'Bisoprolol fumarate',                dosage:'5 mg',       forme:'Comprimé',    classe:'Bêtabloquant',                posologie:'1×/jour matin',                        indication:'HTA, Insuffisance cardiaque, Angor',            contreIndication:'Asthme, BAV 2-3',                           favorite:true  },
  { id:22,  nom:'Atenolol',              dci:'Aténolol',                           dosage:'50 mg',      forme:'Comprimé',    classe:'Bêtabloquant',                posologie:'1×/jour',                              indication:'HTA, Angor',                                    contreIndication:'Asthme, BAV',                               favorite:false },
  { id:23,  nom:'Metoprolol',            dci:'Métoprolol tartrate',                dosage:'100 mg',     forme:'Comprimé',    classe:'Bêtabloquant',                posologie:'1-2×/jour',                            indication:'HTA, Angor, Tachycardie',                       contreIndication:'Asthme, BAV 2-3',                           favorite:false },
  // ── IEC ───────────────────────────────────────────────────
  { id:13,  nom:'Perindopril',           dci:'Périndopril arginine',               dosage:'5 mg',       forme:'Comprimé',    classe:'IEC',                         posologie:'1×/jour matin',                        indication:'HTA, Insuffisance cardiaque',                   contreIndication:'Grossesse, angio-œdème',                    favorite:false },
  { id:14,  nom:'Enalapril',             dci:'Énalapril maléate',                  dosage:'10 mg',      forme:'Comprimé',    classe:'IEC',                         posologie:'1-2×/jour',                            indication:'HTA, Insuffisance cardiaque',                   contreIndication:'Grossesse, angio-œdème',                    favorite:false },
  { id:15,  nom:'Ramipril',              dci:'Ramipril',                           dosage:'5 mg',       forme:'Gélule',      classe:'IEC',                         posologie:'1×/jour',                              indication:'HTA, Cardioprotection post-IDM',                contreIndication:'Grossesse, hyperkaliémie',                  favorite:false },
  { id:16,  nom:'Lisinopril',            dci:'Lisinopril',                         dosage:'10 mg',      forme:'Comprimé',    classe:'IEC',                         posologie:'1×/jour',                              indication:'HTA, Insuffisance cardiaque',                   contreIndication:'Grossesse, angio-œdème',                    favorite:false },
  // ── ARA II ────────────────────────────────────────────────
  { id:7,   nom:'Losartan',              dci:'Losartan potassique',                dosage:'50 mg',      forme:'Comprimé',    classe:'ARA II',                      posologie:'1×/jour',                              indication:'HTA, Insuffisance cardiaque',                   contreIndication:'Grossesse, hyperkaliémie',                  favorite:false },
  { id:17,  nom:'Valsartan',             dci:'Valsartan',                          dosage:'80 mg',      forme:'Comprimé',    classe:'ARA II',                      posologie:'1×/jour',                              indication:'HTA, Insuffisance cardiaque',                   contreIndication:'Grossesse, hyperkaliémie',                  favorite:false },
  { id:18,  nom:'Irbesartan',            dci:'Irbésartan',                         dosage:'150 mg',     forme:'Comprimé',    classe:'ARA II',                      posologie:'1×/jour',                              indication:'HTA, Néphropathie diabétique',                  contreIndication:'Grossesse',                                 favorite:false },
  { id:19,  nom:'Telmisartan',           dci:'Telmisartan',                        dosage:'40 mg',      forme:'Comprimé',    classe:'ARA II',                      posologie:'1×/jour',                              indication:'HTA, Prévention CV',                            contreIndication:'Grossesse, cholestase',                     favorite:false },
  // ── Diurétiques ───────────────────────────────────────────
  { id:24,  nom:'Hydrochlorothiazide',   dci:'Hydrochlorothiazide',                dosage:'25 mg',      forme:'Comprimé',    classe:'Diurétique thiazidique',      posologie:'1×/jour matin',                        indication:'HTA, Œdèmes',                                   contreIndication:'Anurie, hypokaliémie sévère',               favorite:false },
  { id:25,  nom:'Furosémide',            dci:'Furosémide',                         dosage:'40 mg',      forme:'Comprimé',    classe:"Diurétique de l'anse",        posologie:'1×/jour matin',                        indication:'Œdèmes, Insuffisance cardiaque, HTA',           contreIndication:'Anurie, hypovolémie',                       favorite:false },
  { id:26,  nom:'Spironolactone',        dci:'Spironolactone',                     dosage:'25 mg',      forme:'Comprimé',    classe:'Diurétique épargnant K+',     posologie:'1-2×/jour',                            indication:'Insuffisance cardiaque, Hyperaldostéronisme',   contreIndication:'Hyperkaliémie, anurie',                     favorite:false },
  // ── Antidiabétiques ───────────────────────────────────────
  { id:3,   nom:'Metformine',            dci:'Metformine chlorhydrate',            dosage:'500 mg',     forme:'Comprimé',    classe:'Antidiabétique oral',         posologie:'2-3×/jour au repas',                   indication:'Diabète type 2',                                contreIndication:'Insuffisance rénale sévère',                favorite:true  },
  { id:27,  nom:'Metformine 850',        dci:'Metformine chlorhydrate',            dosage:'850 mg',     forme:'Comprimé',    classe:'Antidiabétique oral',         posologie:'2×/jour au repas',                     indication:'Diabète type 2',                                contreIndication:'Insuffisance rénale, hépatique',            favorite:false },
  { id:28,  nom:'Glibenclamide',         dci:'Glibenclamide',                      dosage:'5 mg',       forme:'Comprimé',    classe:'Sulfonylurée',                posologie:'1-2×/jour avant repas',                indication:'Diabète type 2',                                contreIndication:'Diabète type 1, IHC, IRC',                  favorite:false },
  { id:29,  nom:'Gliclazide LP',         dci:'Gliclazide',                         dosage:'30 mg',      forme:'Comprimé LP', classe:'Sulfonylurée',                posologie:'1×/jour au petit-déjeuner',            indication:'Diabète type 2',                                contreIndication:'DT1, IHC, IRC sévère',                      favorite:false },
  { id:30,  nom:'Sitagliptine',          dci:'Sitagliptine phosphate',             dosage:'100 mg',     forme:'Comprimé',    classe:'Gliptine',                    posologie:'1×/jour',                              indication:'Diabète type 2',                                contreIndication:'DT1, insuffisance rénale sévère',           favorite:false },
  { id:31,  nom:'Insuline NPH',          dci:'Insuline isophane humaine',          dosage:'100 UI/mL',  forme:'Injection',   classe:'Insuline',                    posologie:'1-2×/jour SC',                         indication:'Diabète type 1 et 2',                           contreIndication:'Hypoglycémie',                              favorite:false },
  { id:32,  nom:'Insuline Glargine',     dci:'Insuline glargine',                  dosage:'100 UI/mL',  forme:'Stylo',       classe:'Insuline',                    posologie:'1×/jour même heure',                   indication:'Diabète type 1 et 2',                           contreIndication:'Hypoglycémie',                              favorite:false },
  // ── Statines / Fibrates ───────────────────────────────────
  { id:8,   nom:'Atorvastatine',         dci:'Atorvastatine calcique',             dosage:'20 mg',      forme:'Comprimé',    classe:'Statine',                     posologie:'1×/jour le soir',                      indication:'Hypercholestérolémie',                          contreIndication:'Myopathie, grossesse',                      favorite:false },
  { id:33,  nom:'Simvastatine',          dci:'Simvastatine',                       dosage:'20 mg',      forme:'Comprimé',    classe:'Statine',                     posologie:'1×/jour le soir',                      indication:'Hypercholestérolémie, Prévention CV',           contreIndication:'Myopathie, grossesse',                      favorite:false },
  { id:34,  nom:'Rosuvastatine',         dci:'Rosuvastatine calcique',             dosage:'10 mg',      forme:'Comprimé',    classe:'Statine',                     posologie:'1×/jour',                              indication:'Hypercholestérolémie, Prévention CV',           contreIndication:'Myopathie, grossesse, IHC',                 favorite:false },
  { id:35,  nom:'Pravastatine',          dci:'Pravastatine sodique',               dosage:'40 mg',      forme:'Comprimé',    classe:'Statine',                     posologie:'1×/jour le soir',                      indication:'Hypercholestérolémie',                          contreIndication:'IHC, grossesse',                            favorite:false },
  { id:36,  nom:'Fénofibrate',           dci:'Fénofibrate',                        dosage:'145 mg',     forme:'Comprimé',    classe:'Fibrate',                     posologie:'1×/jour au repas',                     indication:'Hypertriglycéridémie, dyslipidémie',            contreIndication:'IHC, IRC sévère, grossesse',                favorite:false },
  // ── Antibiotiques ─────────────────────────────────────────
  { id:9,   nom:'Amoxicilline',          dci:'Amoxicilline trihydrate',            dosage:'500 mg',     forme:'Gélule',      classe:'Antibiotique',                posologie:'3×/jour pendant 7j',                   indication:'Infections bactériennes ORL',                   contreIndication:'Allergie pénicillines',                     favorite:true  },
  { id:37,  nom:'Amoxicilline 1g',       dci:'Amoxicilline trihydrate',            dosage:'1 g',        forme:'Comprimé',    classe:'Antibiotique',                posologie:'2-3×/jour pendant 7j',                 indication:'Infections respiratoires, ORL, dentaires',     contreIndication:'Allergie pénicillines',                     favorite:true  },
  { id:38,  nom:'Augmentin 1g',          dci:'Amoxicilline + Acide clavulanique',  dosage:'1 g',        forme:'Comprimé',    classe:'Antibiotique',                posologie:'2-3×/jour au repas',                   indication:'Infections bactériennes résistantes',           contreIndication:'Allergie pénicillines, IHC',                favorite:true  },
  { id:39,  nom:'Azithromycine',         dci:'Azithromycine',                      dosage:'500 mg',     forme:'Comprimé',    classe:'Antibiotique',                posologie:'1×/jour pendant 3j',                   indication:'Infections ORL, respiratoires, chlamydia',     contreIndication:'Allergie macrolides, arythmie',             favorite:false },
  { id:40,  nom:'Ciprofloxacine',        dci:'Ciprofloxacine chlorhydrate',        dosage:'500 mg',     forme:'Comprimé',    classe:'Antibiotique',                posologie:'2×/jour pendant 7j',                   indication:'Infections urinaires, entérites',               contreIndication:'Tendinite, épilepsie, grossesse',           favorite:false },
  { id:41,  nom:'Clarithromycine',       dci:'Clarithromycine',                    dosage:'500 mg',     forme:'Comprimé',    classe:'Antibiotique',                posologie:'2×/jour pendant 7j',                   indication:'Infections ORL, respiratoires, H. pylori',     contreIndication:'Arythmie, grossesse',                       favorite:false },
  { id:42,  nom:'Doxycycline',           dci:'Doxycycline monohydrate',            dosage:'100 mg',     forme:'Gélule',      classe:'Antibiotique',                posologie:'1-2×/jour',                            indication:'Acné, chlamydia, paludisme',                    contreIndication:'Grossesse, enfants < 8 ans',               favorite:false },
  { id:43,  nom:'Métronidazole',         dci:'Métronidazole',                      dosage:'500 mg',     forme:'Comprimé',    classe:'Antibiotique',                posologie:'3×/jour pendant 7j',                   indication:'Infections anaérobies, amibiase, trichomonase', contreIndication:'Alcool, grossesse T1',                     favorite:false },
  { id:44,  nom:'Cotrimoxazole',         dci:'Sulfaméthoxazole + Triméthoprime',   dosage:'960 mg',     forme:'Comprimé',    classe:'Antibiotique',                posologie:'2×/jour',                              indication:'Infections urinaires, pneumocystose',           contreIndication:'Grossesse T3, allergie sulfamides',         favorite:false },
  { id:45,  nom:'Ceftriaxone 1g',        dci:'Ceftriaxone sodique',                dosage:'1 g',        forme:'Injection',   classe:'Antibiotique',                posologie:'1×/jour IM ou IV',                     indication:'Infections sévères, méningite',                contreIndication:'Allergie céphalosporines',                  favorite:false },
  { id:109, nom:'Nitrofurantoïne',       dci:'Nitrofurantoïne',                    dosage:'100 mg',     forme:'Gélule LP',   classe:'Antibiotique',                posologie:'2×/jour pendant 5-7j',                 indication:'Infections urinaires basses',                   contreIndication:'IRC, grossesse T3',                         favorite:false },
  // ── IPP / Gastro-entérologie ──────────────────────────────
  { id:4,   nom:'Oméprazole',            dci:'Oméprazole',                         dosage:'20 mg',      forme:'Gélule',      classe:'IPP',                         posologie:'1×/jour à jeun',                       indication:'RGO, Ulcère gastroduodénal',                    contreIndication:'Hypersensibilité aux IPP',                  favorite:true  },
  { id:46,  nom:'Esoméprazole',          dci:'Ésoméprazole magnésium',             dosage:'20 mg',      forme:'Gélule',      classe:'IPP',                         posologie:'1×/jour à jeun',                       indication:'RGO, Ulcère gastrique et duodénal',             contreIndication:'Hypersensibilité aux IPP',                  favorite:true  },
  { id:47,  nom:'Pantoprazole',          dci:'Pantoprazole sodique',               dosage:'40 mg',      forme:'Comprimé',    classe:'IPP',                         posologie:'1×/jour à jeun',                       indication:'RGO, Prévention ulcère sous AINS',              contreIndication:'Hypersensibilité aux IPP',                  favorite:false },
  { id:53,  nom:'Ranitidine',            dci:'Ranitidine chlorhydrate',            dosage:'150 mg',     forme:'Comprimé',    classe:'Antihistaminique H2',         posologie:'2×/jour ou 1×/soir',                   indication:'Ulcère gastrique, RGO',                         contreIndication:'Porphyrie',                                 favorite:false },
  { id:48,  nom:'Dompéridone',           dci:'Dompéridone',                        dosage:'10 mg',      forme:'Comprimé',    classe:'Antiémétique',                posologie:'3×/jour avant repas',                  indication:'Nausées, vomissements, reflux',                 contreIndication:'Arythmie cardiaque',                        favorite:false },
  { id:49,  nom:'Metoclopramide',        dci:'Métoclopramide chlorhydrate',        dosage:'10 mg',      forme:'Comprimé',    classe:'Antiémétique',                posologie:'3×/jour avant repas',                  indication:'Nausées, vomissements, gastroparésie',          contreIndication:'Parkinson, phéochromocytome',               favorite:false },
  { id:50,  nom:'Hyoscine',              dci:'Scopolamine butylbromure',           dosage:'10 mg',      forme:'Comprimé',    classe:'Antispasmodique',             posologie:'3-5×/jour',                            indication:'Spasmes digestifs, coliques',                   contreIndication:'Glaucome, rétention urinaire',              favorite:false },
  { id:52,  nom:'Trimébutine',           dci:'Trimébutine maléate',                dosage:'100 mg',     forme:'Comprimé',    classe:'Antispasmodique',             posologie:'3×/jour avant repas',                  indication:'Troubles fonctionnels intestinaux, SII',        contreIndication:'Hypersensibilité',                          favorite:false },
  { id:51,  nom:'Lopéramide',            dci:'Lopéramide chlorhydrate',            dosage:'2 mg',       forme:'Gélule',      classe:'Antidiarrhéique',             posologie:'2 initiale, puis 1 après selles',      indication:'Diarrhée aiguë et chronique',                   contreIndication:'Enfants < 2 ans, colite infectieuse',       favorite:false },
  // ── Analgésiques / AINS ───────────────────────────────────
  { id:5,   nom:'Paracétamol',           dci:'Paracétamol',                        dosage:'1000 mg',    forme:'Comprimé',    classe:'Analgésique',                 posologie:'3×/jour (max 4g/24h)',                  indication:'Douleur, Fièvre',                               contreIndication:'Insuffisance hépatique sévère',             favorite:true  },
  { id:6,   nom:'Ibuprofène',            dci:'Ibuprofène',                         dosage:'400 mg',     forme:'Comprimé',    classe:'AINS',                        posologie:'3×/jour au repas',                     indication:'Douleur, Fièvre, Inflammation',                 contreIndication:'Ulcère gastrique, grossesse T3',            favorite:true  },
  { id:54,  nom:'Diclofénac',            dci:'Diclofénac sodique',                 dosage:'50 mg',      forme:'Comprimé',    classe:'AINS',                        posologie:'2-3×/jour au repas',                   indication:'Douleur, Inflammation, Arthrose',               contreIndication:'Ulcère gastrique, grossesse T3',            favorite:false },
  { id:55,  nom:'Kétoprofène',           dci:'Kétoprofène',                        dosage:'100 mg',     forme:'Gélule',      classe:'AINS',                        posologie:'2×/jour au repas',                     indication:'Douleur, Inflammation',                         contreIndication:'Ulcère, grossesse T3',                      favorite:false },
  { id:56,  nom:'Méloxicam',             dci:'Méloxicam',                          dosage:'15 mg',      forme:'Comprimé',    classe:'AINS',                        posologie:'1×/jour au repas',                     indication:'Arthrose, Polyarthrite rhumatoïde',             contreIndication:'Ulcère, insuffisance rénale',               favorite:false },
  { id:57,  nom:'Tramadol',              dci:'Tramadol chlorhydrate',              dosage:'50 mg',      forme:'Gélule',      classe:'Analgésique opioïde',         posologie:'2-4×/jour max 400mg/j',                indication:'Douleur modérée à sévère',                      contreIndication:'Épilepsie, IMAO, grossesse',               favorite:false },
  { id:58,  nom:'Tramadol LP',           dci:'Tramadol chlorhydrate',              dosage:'100 mg',     forme:'Comprimé LP', classe:'Analgésique opioïde',         posologie:'2×/jour',                              indication:'Douleur chronique modérée à sévère',            contreIndication:'Épilepsie, IMAO',                           favorite:false },
  { id:59,  nom:'Codéine/Paracétamol',   dci:'Codéine + Paracétamol',             dosage:'30/500 mg',  forme:'Comprimé',    classe:'Analgésique opioïde',         posologie:'3-4×/jour max',                        indication:'Douleur modérée',                               contreIndication:'Enfants < 12 ans, asthme',                 favorite:false },
  // ── Cardiologie ───────────────────────────────────────────
  { id:60,  nom:'Aspirine 100',          dci:'Acide acétylsalicylique',            dosage:'100 mg',     forme:'Comprimé',    classe:'Antiagrégant plaquettaire',   posologie:'1×/jour pendant le repas',             indication:'Prévention CV, Angor, Post-IDM',                contreIndication:'Ulcère gastrique, allergie',                favorite:true  },
  { id:61,  nom:'Clopidogrel',           dci:'Clopidogrel bisulfate',              dosage:'75 mg',      forme:'Comprimé',    classe:'Antiagrégant plaquettaire',   posologie:'1×/jour',                              indication:'Prévention thrombose, Post-IDM, AVC',           contreIndication:'Saignement actif, grossesse',               favorite:false },
  { id:62,  nom:'Warfarine',             dci:'Warfarine sodique',                  dosage:'5 mg',       forme:'Comprimé',    classe:'Anticoagulant oral',          posologie:'1×/jour (adapter à INR)',               indication:'Fibrillation auriculaire, MTEV',                contreIndication:'Saignement actif, grossesse',               favorite:false },
  { id:63,  nom:'Dabigatran',            dci:'Dabigatran étexilate',               dosage:'110 mg',     forme:'Gélule',      classe:'Anticoagulant oral',          posologie:'2×/jour',                              indication:'FA, MTEV, prévention AVC',                      contreIndication:'IRC sévère, saignement',                    favorite:false },
  { id:64,  nom:'Rivaroxaban',           dci:'Rivaroxaban',                        dosage:'20 mg',      forme:'Comprimé',    classe:'Anticoagulant oral',          posologie:'1×/jour au repas',                     indication:'FA, MTEV, prévention thrombo-embolie',          contreIndication:'IRC, saignement actif',                     favorite:false },
  { id:65,  nom:'Nitroglycérine',        dci:'Glycéryle trinitrate',               dosage:'0,5 mg',     forme:'Spray sublingual',classe:'Dérivé nitré',            posologie:'1-2 pulv sous la langue si besoin',    indication:"Crise d'angor",                                 contreIndication:'Hypotension, Sildénafil',                   favorite:false },
  { id:66,  nom:'Isosorbide',            dci:"Mononitrate d'isosorbide",           dosage:'20 mg',      forme:'Comprimé',    classe:'Dérivé nitré',                posologie:'2×/jour',                              indication:'Prévention angor',                              contreIndication:'Hypotension, Sildénafil',                   favorite:false },
  { id:67,  nom:'Digoxine',              dci:'Digoxine',                           dosage:'0,25 mg',    forme:'Comprimé',    classe:'Antiarythmique',              posologie:'1×/jour (adapter)',                    indication:'Insuffisance cardiaque, FA',                    contreIndication:'BAV, intoxication digitalique',             favorite:false },
  { id:68,  nom:'Amiodarone',            dci:'Amiodarone chlorhydrate',            dosage:'200 mg',     forme:'Comprimé',    classe:'Antiarythmique',              posologie:'Variable selon protocole',             indication:'Tachyarythmies',                                contreIndication:'Dysthyroïdie, grossesse',                   favorite:false },
  // ── Respiratoire ──────────────────────────────────────────
  { id:11,  nom:'Salbutamol',            dci:'Salbutamol sulfate',                 dosage:'100 µg',     forme:'Inhalateur',  classe:'Bronchodilatateur B2',        posologie:'2 bouffées si besoin',                 indication:'Asthme, BPCO',                                  contreIndication:'Hypersensibilité',                          favorite:false },
  { id:69,  nom:'Formotérol',            dci:'Formotérol fumarate',                dosage:'12 µg',      forme:'Inhalateur',  classe:'Bronchodilatateur B2',        posologie:'2 bouffées 2×/jour',                   indication:'Asthme, BPCO',                                  contreIndication:'Hypersensibilité',                          favorite:false },
  { id:70,  nom:'Tiotropium',            dci:'Tiotropium bromure',                 dosage:'18 µg',      forme:'Inhalateur',  classe:'Anticholinergique',           posologie:'1 inhalation/jour',                    indication:'BPCO',                                          contreIndication:'Glaucome, rétention urinaire',              favorite:false },
  { id:71,  nom:'Béclométasone',         dci:'Dipropionate de béclométasone',      dosage:'250 µg',     forme:'Inhalateur',  classe:'Corticoïde inhalé',           posologie:'2 bouffées 2×/jour',                   indication:'Asthme persistant',                             contreIndication:'Infections fongiques voies resp.',          favorite:false },
  { id:72,  nom:'Fluticasone/Salmétérol',dci:'Fluticasone + Salmétérol',          dosage:'250/25 µg',  forme:'Inhalateur',  classe:'Corticoïde inhalé',           posologie:'2 bouffées 2×/jour',                   indication:'Asthme, BPCO',                                  contreIndication:'Hypersensibilité',                          favorite:false },
  { id:73,  nom:'Montélukast',           dci:'Montélukast sodique',                dosage:'10 mg',      forme:'Comprimé',    classe:'Antileucotriènes',            posologie:'1×/jour le soir',                      indication:'Asthme allergique, rhinite allergique',         contreIndication:'Hypersensibilité',                          favorite:false },
  { id:74,  nom:'Bromhexine',            dci:'Bromhexine chlorhydrate',            dosage:'8 mg',       forme:'Comprimé',    classe:'Mucolytique',                 posologie:'3×/jour',                              indication:'Bronchite, expectorations',                     contreIndication:'Ulcère gastrique',                          favorite:false },
  { id:75,  nom:'Acétylcystéine',        dci:'N-Acétylcystéine',                   dosage:'600 mg',     forme:'Sachet',      classe:'Mucolytique',                 posologie:'1 sachet/jour dans eau',               indication:'Bronchite chronique, expectorations',           contreIndication:'Asthme (prudence)',                         favorite:false },
  // ── Antihistaminiques ─────────────────────────────────────
  { id:76,  nom:'Cétirizine',            dci:'Cétirizine dichlorhydrate',          dosage:'10 mg',      forme:'Comprimé',    classe:'Antihistaminique H1',         posologie:'1×/jour le soir',                      indication:'Rhinite allergique, urticaire',                 contreIndication:'IRC sévère, hypersensibilité',              favorite:true  },
  { id:77,  nom:'Loratadine',            dci:'Loratadine',                         dosage:'10 mg',      forme:'Comprimé',    classe:'Antihistaminique H1',         posologie:'1×/jour',                              indication:'Rhinite allergique, urticaire',                 contreIndication:'Grossesse (prudence)',                      favorite:false },
  { id:78,  nom:'Desloratadine',         dci:'Desloratadine',                      dosage:'5 mg',       forme:'Comprimé',    classe:'Antihistaminique H1',         posologie:'1×/jour',                              indication:'Rhinite allergique, urticaire',                 contreIndication:'Hypersensibilité',                          favorite:false },
  { id:79,  nom:'Fexofénadine',          dci:'Fexofénadine chlorhydrate',          dosage:'120 mg',     forme:'Comprimé',    classe:'Antihistaminique H1',         posologie:'1×/jour',                              indication:'Rhinite allergique, urticaire idiopathique',    contreIndication:'IRC sévère',                                favorite:false },
  // ── Corticoïdes ───────────────────────────────────────────
  { id:10,  nom:'Prednisolone',          dci:'Prednisolone',                       dosage:'20 mg',      forme:'Comprimé',    classe:'Corticoïde',                  posologie:'Variable selon schéma',                indication:'Inflammations, Allergies',                      contreIndication:'Infections non contrôlées',                 favorite:false },
  { id:90,  nom:'Prednisone',            dci:'Prednisone',                         dosage:'5 mg',       forme:'Comprimé',    classe:'Corticoïde',                  posologie:'Variable selon schéma',                indication:'Inflammations sévères, maladies auto-immunes',  contreIndication:'Infections non contrôlées',                 favorite:false },
  { id:91,  nom:'Bétaméthasone',         dci:'Bétaméthasone disodique',            dosage:'4 mg',       forme:'Injection',   classe:'Corticoïde',                  posologie:'IM selon prescription',                indication:'Allergies sévères, inflammation articulaire',   contreIndication:'Infections, ostéoporose',                   favorite:false },
  { id:92,  nom:'Dexaméthasone',         dci:'Dexaméthasone',                      dosage:'0,5 mg',     forme:'Comprimé',    classe:'Corticoïde',                  posologie:'Variable selon schéma',                indication:'Inflammation, allergie sévère',                 contreIndication:'Infections non traitées',                   favorite:false },
  // ── Neurologie / Psychiatrie ──────────────────────────────
  { id:80,  nom:'Sertraline',            dci:'Sertraline chlorhydrate',            dosage:'50 mg',      forme:'Comprimé',    classe:'ISRS',                        posologie:'1×/jour matin ou soir',                indication:'Dépression, anxiété, TOC, PTSD',                contreIndication:'IMAO, biphasie non traitée',               favorite:false },
  { id:81,  nom:'Fluoxétine',            dci:'Fluoxétine chlorhydrate',            dosage:'20 mg',      forme:'Gélule',      classe:'ISRS',                        posologie:'1×/jour matin',                        indication:'Dépression, boulimie, TOC',                     contreIndication:'IMAO, biphasie non traitée',               favorite:false },
  { id:82,  nom:'Paroxétine',            dci:'Paroxétine chlorhydrate',            dosage:'20 mg',      forme:'Comprimé',    classe:'ISRS',                        posologie:'1×/jour matin au repas',               indication:'Dépression, anxiété généralisée, TOC',          contreIndication:'IMAO, grossesse T1',                        favorite:false },
  { id:83,  nom:'Bromazépam',            dci:'Bromazépam',                         dosage:'6 mg',       forme:'Comprimé',    classe:'Anxiolytique',                posologie:'1-3×/jour (court terme)',               indication:'Anxiété, insomnie ponctuelle',                  contreIndication:'Dépendance, dépression respi.',             favorite:false },
  { id:84,  nom:'Alprazolam',            dci:'Alprazolam',                         dosage:'0,25 mg',    forme:'Comprimé',    classe:'Anxiolytique',                posologie:'2-3×/jour (court terme)',               indication:'Anxiété, troubles paniques',                    contreIndication:'Alcool, dépression respi.',                 favorite:false },
  { id:85,  nom:'Zolpidem',              dci:'Zolpidem tartrate',                  dosage:'10 mg',      forme:'Comprimé',    classe:'Hypnotique',                  posologie:'1×/nuit (court terme)',                 indication:'Insomnie transitoire',                          contreIndication:'Insuffisance resp., apnée',                 favorite:false },
  { id:86,  nom:'Valproate de sodium',   dci:'Valproate de sodium',                dosage:'200 mg',     forme:'Comprimé',    classe:'Antiépileptique',             posologie:'2-3×/jour',                            indication:'Épilepsie, trouble bipolaire',                  contreIndication:'IHC, grossesse (tératogène)',               favorite:false },
  { id:87,  nom:'Carbamazépine',         dci:'Carbamazépine',                      dosage:'200 mg',     forme:'Comprimé',    classe:'Antiépileptique',             posologie:'2-3×/jour',                            indication:'Épilepsie, névralgie du trijumeau',             contreIndication:'BAV, interactions nombreuses',              favorite:false },
  { id:88,  nom:'Levodopa/Carbidopa',    dci:'Lévodopa + Carbidopa',               dosage:'100/25 mg',  forme:'Comprimé',    classe:'Anti-parkinsonien',           posologie:'3×/jour',                              indication:'Maladie de Parkinson',                          contreIndication:'Glaucome fermé, IMAO',                      favorite:false },
  { id:89,  nom:'Sumatriptan',           dci:'Sumatriptan succinate',              dosage:'50 mg',      forme:'Comprimé',    classe:'Triptan',                     posologie:'1 cp à la crise (max 2/24h)',           indication:'Migraine',                                      contreIndication:'Coronaropathie, HTA non contrôlée',         favorite:false },
  // ── Thyroïde ──────────────────────────────────────────────
  { id:12,  nom:'Lévothyroxine',         dci:'Lévothyroxine sodique',              dosage:'50 µg',      forme:'Comprimé',    classe:'Hormone thyroïdienne',        posologie:'1×/jour à jeun',                       indication:'Hypothyroïdie',                                 contreIndication:'Hyperthyroïdie',                            favorite:false },
  { id:96,  nom:'Lévothyroxine 25',      dci:'Lévothyroxine sodique',              dosage:'25 µg',      forme:'Comprimé',    classe:'Hormone thyroïdienne',        posologie:'1×/jour à jeun 30 min avant repas',    indication:'Hypothyroïdie débutante',                       contreIndication:'Hyperthyroïdie, infarctus récent',          favorite:false },
  { id:97,  nom:'Lévothyroxine 100',     dci:'Lévothyroxine sodique',              dosage:'100 µg',     forme:'Comprimé',    classe:'Hormone thyroïdienne',        posologie:'1×/jour à jeun',                       indication:'Hypothyroïdie franche',                         contreIndication:'Hyperthyroïdie',                            favorite:false },
  { id:98,  nom:'Carbimazole',           dci:'Carbimazole',                        dosage:'5 mg',       forme:'Comprimé',    classe:'Antithyroïdien',              posologie:'3×/jour (initiale)',                   indication:'Hyperthyroïdie, Maladie de Basedow',            contreIndication:'Agranulocytose, grossesse (prudence)',      favorite:false },
  // ── Vitamines / Micronutriments ───────────────────────────
  { id:99,  nom:'Vitamine D3',           dci:'Cholécalciférol',                    dosage:'800 UI',     forme:'Comprimé',    classe:'Vitamine/Micronutriment',     posologie:'1×/jour',                              indication:'Carence en vitamine D, ostéoporose',            contreIndication:'Hypercalcémie',                             favorite:true  },
  { id:100, nom:'Vitamine D3 100 000',   dci:'Cholécalciférol',                    dosage:'100 000 UI', forme:'Ampoule',     classe:'Vitamine/Micronutriment',     posologie:'1 ampoule/mois IM ou PO',              indication:'Carence sévère en vitamine D',                  contreIndication:'Hypercalcémie, hypervitaminose D',          favorite:false },
  { id:101, nom:'Acide folique',         dci:'Acide folique',                      dosage:'5 mg',       forme:'Comprimé',    classe:'Vitamine/Micronutriment',     posologie:'1×/jour',                              indication:'Anémie, grossesse (prévention malformations)',  contreIndication:'Carcinome évolutif',                        favorite:false },
  { id:102, nom:'Sulfate de fer',        dci:'Sulfate ferreux',                    dosage:'80 mg',      forme:'Comprimé',    classe:'Vitamine/Micronutriment',     posologie:'1-2×/jour à jeun',                     indication:'Anémie ferriprive',                             contreIndication:'Hémochromatose, surcharge en fer',          favorite:false },
  { id:103, nom:'Calcium + Vit D',       dci:'Carbonate de calcium + Cholécalciférol',dosage:'1000 mg/800 UI',forme:'Comprimé',classe:'Vitamine/Micronutriment',  posologie:'1-2×/jour au repas',                   indication:'Ostéoporose, prévention fractures',             contreIndication:'Hypercalcémie, lithiase rénale',            favorite:false },
  { id:104, nom:'Magnésium',             dci:'Magnésium lactate',                  dosage:'48 mg',      forme:'Comprimé',    classe:'Vitamine/Micronutriment',     posologie:'3×/jour',                              indication:'Carence magnésium, crampes, stress',            contreIndication:'IRC sévère',                                favorite:false },
  { id:105, nom:'Zinc',                  dci:'Sulfate de zinc',                    dosage:'15 mg',      forme:'Gélule',      classe:'Vitamine/Micronutriment',     posologie:'1×/jour au repas',                     indication:'Carence zinc, cicatrisation, immunité',         contreIndication:'Grossesse (fortes doses)',                  favorite:false },
  // ── Rhumatologie / Antigoutte ─────────────────────────────
  { id:93,  nom:'Colchicine',            dci:'Colchicine',                         dosage:'1 mg',       forme:'Comprimé',    classe:'Antigoutte',                  posologie:'1 mg initial puis 0,5 mg/h',           indication:'Crise de goutte aiguë',                         contreIndication:'IRC, IHC sévère, grossesse',               favorite:false },
  { id:94,  nom:'Allopurinol',           dci:'Allopurinol',                        dosage:'100 mg',     forme:'Comprimé',    classe:'Hypouricémiant',              posologie:'1-3×/jour selon uricémie',             indication:'Goutte chronique, hyperuricémie',               contreIndication:'Crise aiguë en cours, IRC',                 favorite:false },
  { id:95,  nom:'Hydroxychloroquine',    dci:'Hydroxychloroquine sulfate',         dosage:'200 mg',     forme:'Comprimé',    classe:'Antipaludéen/Immunomod',      posologie:'2×/jour au repas',                     indication:'Polyarthrite rhumatoïde, Lupus, Paludisme',     contreIndication:'Maculopathie, allergie',                    favorite:false },
  { id:115, nom:'Methotrexate',          dci:'Méthotrexate',                       dosage:'2,5 mg',     forme:'Comprimé',    classe:'Immunosuppresseur',           posologie:'1×/semaine (adapter)',                 indication:'Polyarthrite rhumatoïde, psoriasis',            contreIndication:'Grossesse, IHC, IRC, infection',           favorite:false },
  // ── Urologie ──────────────────────────────────────────────
  { id:106, nom:'Tamsulosine',           dci:'Tamsulosine chlorhydrate',           dosage:'0,4 mg',     forme:'Gélule LP',   classe:'Alpha-bloquant',              posologie:'1×/jour après repas',                  indication:'Hypertrophie bénigne de la prostate (HBP)',     contreIndication:'Hypotension orthostatique',                 favorite:false },
  { id:107, nom:'Finastéride',           dci:'Finastéride',                        dosage:'5 mg',       forme:'Comprimé',    classe:'Inhibiteur 5-alpha-réductase',posologie:'1×/jour',                              indication:'HBP, Alopécie androgénique',                    contreIndication:'Femmes, grossesse (manipulation)',          favorite:false },
  { id:108, nom:'Oxybutynine',           dci:'Oxybutynine chlorhydrate',           dosage:'5 mg',       forme:'Comprimé',    classe:'Anticholinergique urinaire',  posologie:'2-3×/jour',                            indication:'Hyperactivité vésicale, incontinence',          contreIndication:'Glaucome, rétention urinaire',              favorite:false },
  // ── Dermatologie / Antifongiques ──────────────────────────
  { id:110, nom:'Clotrimazole crème',    dci:'Clotrimazole',                       dosage:'1%',         forme:'Crème',       classe:'Antifongique',                posologie:'2-3×/jour localement',                 indication:'Mycoses cutanées, candidose',                   contreIndication:'Hypersensibilité aux imidazolés',           favorite:false },
  { id:111, nom:'Kétoconazole',          dci:'Kétoconazole',                       dosage:'200 mg',     forme:'Comprimé',    classe:'Antifongique',                posologie:'1×/jour au repas',                     indication:'Mycoses systémiques et cutanées',               contreIndication:'IHC, nombreuses interactions',              favorite:false },
  { id:112, nom:'Fluconazole',           dci:'Fluconazole',                        dosage:'150 mg',     forme:'Gélule',      classe:'Antifongique',                posologie:'1 gélule dose unique',                 indication:'Candidose vaginale',                            contreIndication:'Terfénadine, grossesse',                    favorite:false },
  { id:113, nom:'Bétaméthasone crème',   dci:'Bétaméthasone valérate',             dosage:'0,1%',       forme:'Crème',       classe:'Corticoïde topique',          posologie:'1-2×/jour localement',                 indication:'Eczéma, psoriasis, dermatite',                  contreIndication:'Rosacea, infections cutanées',              favorite:false },
  // ── Hépatologie / Autres ──────────────────────────────────
  { id:114, nom:'Acide ursodéoxycholique',dci:'Acide ursodéoxycholique',          dosage:'300 mg',     forme:'Gélule',      classe:'Hépatoprotecteur',            posologie:'2×/jour au repas',                     indication:'Lithiase biliaire, CBP',                        contreIndication:'Cholécystite aiguë, occlusion',             favorite:false },
];

export const FORMES  = ['Comprimé','Comprimé LP','Gélule','Gélule LP','Sirop','Inhalateur','Injection','Stylo','Spray sublingual','Pommade','Crème','Suppositoire','Patch','Gouttes','Sachet','Ampoule'];
export const CLASSES = [
  // Cardiovasculaire
  'Inhibiteur calcique','Bêtabloquant','IEC','ARA II',
  'Diurétique thiazidique',"Diurétique de l'anse",'Diurétique épargnant K+',
  'Antiagrégant plaquettaire','Anticoagulant oral','Antiarythmique','Dérivé nitré',
  // Métabolisme
  'Antidiabétique oral','Sulfonylurée','Gliptine','Insuline',
  'Statine','Fibrate',
  // Digestif
  'IPP','Antihistaminique H2','Antiémétique','Antispasmodique','Antidiarrhéique',
  // Analgésie / Rhumatologie
  'Analgésique','Analgésique opioïde','AINS',
  'Antigoutte','Hypouricémiant','Immunosuppresseur',
  // Infectiologie
  'Antibiotique','Antifongique','Antipaludéen/Immunomod',
  // Respiratoire
  'Bronchodilatateur B2','Anticholinergique','Corticoïde inhalé','Antileucotriènes','Mucolytique',
  // Allergologie
  'Antihistaminique H1',
  // Corticoïdes
  'Corticoïde','Corticoïde topique',
  // Neurologie / Psychiatrie
  'ISRS','Anxiolytique','Hypnotique','Antiépileptique','Anti-parkinsonien','Triptan',
  // Thyroïde / Hormones
  'Hormone thyroïdienne','Antithyroïdien',
  // Vitamines / Micronutriments
  'Vitamine/Micronutriment','Hépatoprotecteur',
  // Urologie
  'Alpha-bloquant','Inhibiteur 5-alpha-réductase','Anticholinergique urinaire',
  'Autre',
];
export const RDV_STATUTS  = ['Programmé','Confirmé','Patient absent','Annulé','Consultation terminée'];
export const DOC_TYPES    = ['Analyse','Radio','Ordonnance','Compte rendu','Certificat','Autre'];
export const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
export const ICON_EMOJIS  = ['💊','🏥','✅','⚽','🏫','✈️','🔄','📋','🧪','🔬','📄','💉','🩺','🩹','❤️','🧠','👁️','🦷','🦴'];
export const COLORS_PICK  = ['#a78bfa','#f87171','#00c9a7','#4a7bff','#fbbf24','#4ade80','#f472b6','#34d399','#818cf8','#60a5fa','#fb923c'];
