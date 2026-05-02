import { useState } from 'react';
import { T, applyTheme } from './theme';
import { AppProvider, useApp } from './context/AppContext';
import { initDB } from './db/database';

import GlobalStyles     from './components/GlobalStyles';
import Sidebar          from './components/Sidebar';
import Header           from './components/Header';
import UpdateBanner     from './components/UpdateBanner';

import DashboardPage    from './pages/DashboardPage';
import CalendarPage     from './pages/CalendarPage';
import PatientsPage     from './pages/PatientsPage';
import ConsultationPage from './pages/ConsultationPage';
import PapierPage       from './pages/PapierPage';
import MedicationsPage  from './pages/MedicationsPage';
import FinanceDashboard from './pages/FinanceDashboard';
import SettingsPage     from './pages/SettingsPage';

initDB();

const AppInner = () => {
  const { theme, fontSize, fontFamily, language } = useApp();
  const [page,      setPage]      = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);

  // Apply theme synchronously — T is mutated before JSX evaluates T.xxx
  applyTheme(theme || 'dark');
  const fontFamilyStr = `${fontFamily || 'Plus Jakarta Sans'}, sans-serif`;
  const fontSizeStr   = `${fontSize   || 14}px`;
  const isRTL         = language === 'ar';

  const renderPage = () => {
    switch(page) {
      case 'dashboard':    return <DashboardPage    setPage={setPage} />;
      case 'calendar':     return <CalendarPage     setPage={setPage} />;
      case 'patients':     return <PatientsPage     setPage={setPage} />;
      case 'consultation': return <ConsultationPage setPage={setPage} />;
      case 'papier':       return <PapierPage       setPage={setPage} />;
      case 'medications':  return <MedicationsPage  />;
      case 'finance':      return <FinanceDashboard />;
      case 'settings':     return <SettingsPage     />;
      default:             return <DashboardPage    setPage={setPage} />;
    }
  };

  return (
    <div style={{
      display:'flex', height:'100vh',
      background: T.bg,
      fontFamily: fontFamilyStr,
      fontSize: fontSizeStr,
      color: T.text,
      overflow:'hidden',
      direction: isRTL ? 'rtl' : 'ltr',
    }}>
      <GlobalStyles />
      <Sidebar page={page} setPage={setPage} collapsed={collapsed} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <Header page={page} onToggleSidebar={()=>setCollapsed(c=>!c)} setPage={setPage} />
        <main style={{ flex:1, overflowY:'auto', padding:20 }}>
          {renderPage()}
        </main>
      </div>
      {/* Notification de mise à jour — en bas à droite, non bloquante */}
      <UpdateBanner />
    </div>
  );
};

const App = () => (
  <AppProvider><AppInner /></AppProvider>
);

export default App;
