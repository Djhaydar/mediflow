import { useState, useEffect } from 'react';
import { T } from '../theme';

/**
 * Bandeau de notification de mise à jour.
 * Apparaît automatiquement si window.electronAPI signale une nouvelle version.
 * Fonctionne uniquement dans Electron (window.electronAPI absent dans le navigateur).
 */
const UpdateBanner = () => {
  const [update,    setUpdate]    = useState(null);   // { current, latest, date, notes, url }
  const [expanded,  setExpanded]  = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [appVersion, setAppVersion] = useState('');

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return; // Pas dans Electron → rien à faire

    // Récupérer la version courante
    api.getVersion().then(v => setAppVersion(v)).catch(() => {});

    // Écouter l'événement "update-available"
    api.onUpdateAvailable((data) => {
      setUpdate(data);
      setDismissed(false);
    });

    return () => {
      api.removeAllListeners('update-available');
    };
  }, []);

  if (!update || dismissed) return null;

  const handleDownload = () => {
    window.electronAPI?.openExternal(update.url);
  };

  const handleDismiss = () => setDismissed(true);

  return (
    <div style={{
      position:     'fixed',
      bottom:        20,
      right:         20,
      zIndex:        9999,
      width:         360,
      background:    T.surface,
      border:        `1.5px solid #f59e0b`,
      borderRadius:  16,
      boxShadow:    `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.2)`,
      overflow:      'hidden',
      animation:     'slideUp 0.4s cubic-bezier(.16,1,.3,1)',
    }}>
      {/* Barre de couleur en haut */}
      <div style={{ height: 4, background: 'linear-gradient(90deg,#f59e0b,#f97316)', borderRadius: '14px 14px 0 0' }} />

      <div style={{ padding: '14px 16px' }}>
        {/* En-tête */}
        <div style={{ display:'flex', alignItems:'flex-start', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🔔</div>

          <div style={{ flex: 1 }}>
            <div style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:13, color: T.text }}>
              Mise à jour disponible
            </div>
            <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
              v{update.current} → <span style={{ color:'#f59e0b', fontWeight:600 }}>v{update.latest}</span>
              {update.date && <span> · {update.date}</span>}
            </div>
          </div>

          <button
            onClick={handleDismiss}
            style={{ background:'none', border:'none', cursor:'pointer', color:T.textMuted, padding:2, lineHeight:1, fontSize:16 }}
            title="Ignorer"
          >×</button>
        </div>

        {/* Notes de version (expandable) */}
        {update.notes?.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{ background:'none', border:'none', cursor:'pointer', color:T.textMuted, fontSize:11, padding:0, display:'flex', alignItems:'center', gap:4 }}
            >
              <span style={{ transform: expanded ? 'rotate(90deg)' : 'none', display:'inline-block', transition:'transform 0.2s' }}>▶</span>
              {expanded ? 'Masquer les nouveautés' : `Voir les nouveautés (${update.notes.length})`}
            </button>
            {expanded && (
              <ul style={{ margin:'8px 0 0 0', padding:'0 0 0 16px', fontSize:12, color:T.textSub, lineHeight:1.8 }}>
                {update.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}
          </div>
        )}

        {/* Boutons */}
        <div style={{ display:'flex', gap:8, marginTop:14 }}>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg,#f59e0b,#f97316)',
              border: 'none',
              borderRadius: 8,
              padding: '9px 0',
              cursor: 'pointer',
              color: '#000',
              fontWeight: 700,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            ⬇️ Télécharger v{update.latest}
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: '9px 14px',
              cursor: 'pointer',
              color: T.textMuted,
              fontWeight: 500,
              fontSize: 12,
            }}
          >
            Plus tard
          </button>
        </div>

        {/* Version actuelle */}
        {appVersion && (
          <div style={{ marginTop: 8, fontSize: 10, color: T.textMuted, textAlign: 'center' }}>
            Version installée : v{appVersion}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UpdateBanner;
