import { T } from '../theme';
import Icon from '../components/Icon';
import { Card, Badge, Empty } from '../components/UI';
import { useApp } from '../context/AppContext';

const StatCard = ({ title, value, subtitle, icon, color, colorDim }) => (
  <Card style={{ display:'flex', flexDirection:'column', gap:12 }}>
    <div style={{ width:40, height:40, borderRadius:10, background:colorDim, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <Icon name={icon} size={18} color={color} />
    </div>
    <div>
      <div style={{ fontSize:28, fontWeight:800, color:T.text, fontFamily:'Syne, sans-serif', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12, color:T.textSub, marginTop:4 }}>{title}</div>
    </div>
    <div style={{ fontSize:11, color:T.textMuted }}>{subtitle}</div>
  </Card>
);

const DashboardPage = ({ setPage }) => {
  const { getStats, updateRdv } = useApp();
  const stats = getStats();
  const todayRdv = stats.todayRdv;
  const pending = todayRdv.filter(r=>r.statut==='Programmé'||r.statut==='Confirmé').length;

  const handleStart = (rdv) => {
    updateRdv(rdv.id, { statut:'Consultation terminée' });
    setPage('consultation');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:16 }}>
        <StatCard title="Patients aujourd'hui" value={stats.todayPatients} subtitle={`${pending} en attente`} icon="patients" color={T.blue} colorDim={T.blueDim} />
        <StatCard title="Consultations ce mois" value={stats.monthConsults} subtitle="Ce mois-ci" icon="activity" color={T.teal} colorDim={T.tealDim} />
        <StatCard title="Revenus du jour" value={`${stats.todayRevenue.toLocaleString('fr-FR')} DA`} subtitle={`${stats.monthRevenue.toLocaleString('fr-FR')} DA ce mois`} icon="finance" color={T.amber} colorDim={T.amberDim} />
        <StatCard title="Total patients" value={stats.totalPatients} subtitle="Base de données" icon="patients" color={T.purple} colorDim={T.purpleDim} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        <Card>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:15, color:T.text }}>Rendez-vous d'aujourd'hui</div>
              <div style={{ fontSize:11, color:T.textMuted, marginTop:2 }}>
                {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
              </div>
            </div>
            <button className="btn-primary" onClick={()=>setPage('calendar')} style={{ fontSize:12, padding:'6px 12px', display:'flex', alignItems:'center', gap:6 }}>
              <Icon name="plus" size={12} color="#000" /> Nouveau RDV
            </button>
          </div>

          {todayRdv.length===0 ? (
            <Empty icon="calendar" title="Aucun RDV aujourd'hui" sub="Ajoutez des rendez-vous depuis le calendrier" />
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {todayRdv.map(r=>(
                <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderRadius:10, background:T.card, border:`1px solid ${T.border}` }}>
                  <div style={{ width:28, height:28, borderRadius:'50%', background:`${T.blue}22`, color:T.blue, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>
                    {(r.patientName||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:T.text }}>{r.pinned&&'📌 '}{r.patientName}</div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{r.motif||'Consultation'}</div>
                  </div>
                  <div style={{ fontSize:12, fontWeight:600, color:T.blue, marginRight:8 }}>{r.time}</div>
                  <Badge status={r.statut} />
                  {(r.statut==='Confirmé'||r.statut==='Programmé')&&(
                    <button onClick={()=>handleStart(r)} style={{ background:T.teal, border:'none', borderRadius:7, padding:'5px 10px', cursor:'pointer', color:'#000', fontSize:11, fontWeight:600, whiteSpace:'nowrap' }}>
                      Débuter
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding:14 }}>
          <div style={{ fontFamily:'Syne, sans-serif', fontWeight:700, fontSize:13, color:T.text, marginBottom:10 }}>Actions rapides</div>
          {[
            { label:'Nouveau patient',   icon:'patients',     color:T.blue,   page:'patients'     },
            { label:'Prendre RDV',       icon:'calendar',     color:T.teal,   page:'calendar'     },
            { label:'Créer un papier',   icon:'prescription', color:T.purple, page:'papier'       },
            { label:'Gérer médicaments', icon:'medications',  color:T.pink,   page:'medications'  },
            { label:'Finances',          icon:'finance',      color:T.amber,  page:'finance'      },
          ].map(a=>(
            <div key={a.label} className="hover-card" onClick={()=>setPage(a.page)} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 8px', borderRadius:8, marginBottom:4, cursor:'pointer' }}>
              <div style={{ width:28, height:28, borderRadius:7, background:`${a.color}22`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Icon name={a.icon} size={13} color={a.color} />
              </div>
              <span style={{ fontSize:12, color:T.textSub }}>{a.label}</span>
              <Icon name="chevronRight" size={12} color={T.textMuted} style={{ marginLeft:'auto' }} />
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
