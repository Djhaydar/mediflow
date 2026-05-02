const { app, BrowserWindow, shell, Menu, ipcMain } = require('electron');
const path  = require('path');
const https = require('https');

// ─────────────────────────────────────────────────────────────
//  CONFIG MISE À JOUR
//  Mettre ici l'URL du fichier latest.json hébergé sur GitHub
//  (raw.githubusercontent.com/VOTRE_USER/VOTRE_REPO/main/latest.json)
// ─────────────────────────────────────────────────────────────
const UPDATE_CHECK_URL =
  'https://raw.githubusercontent.com/Djhaydar/mediflow/main/latest.json';

// ─────────────────────────────────────────────────────────────
//  Comparateur de versions semver (ex : "2.1.0" > "2.0.0" → true)
// ─────────────────────────────────────────────────────────────
function isNewer(candidate, current) {
  const parse = v => v.replace(/^v/, '').split('.').map(Number);
  const [ca, cb, cc] = parse(candidate);
  const [ra, rb, rc] = parse(current);
  if (ca !== ra) return ca > ra;
  if (cb !== rb) return cb > rb;
  return cc > rc;
}

// ─────────────────────────────────────────────────────────────
//  Vérification silencieuse des mises à jour
// ─────────────────────────────────────────────────────────────
function checkForUpdates(win) {
  const req = https.get(UPDATE_CHECK_URL, { timeout: 8000 }, (res) => {
    let raw = '';
    res.on('data', chunk => { raw += chunk; });
    res.on('end', () => {
      try {
        const info    = JSON.parse(raw);
        const current = app.getVersion();
        if (info.version && isNewer(info.version, current)) {
          win.webContents.send('update-available', {
            current,
            latest:  info.version,
            date:    info.date    || '',
            notes:   info.notes   || [],
            url:     info.url     || 'https://github.com/mediflow-dz/mediflow/releases/latest',
          });
        }
      } catch {
        // JSON invalide ou réseau indisponible → silencieux
      }
    });
  });

  req.on('error',   () => {}); // Pas de connexion → silencieux
  req.on('timeout', () => { req.destroy(); });
}

// ─────────────────────────────────────────────────────────────
//  Fenêtre principale
// ─────────────────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 860,
    minWidth: 960,
    minHeight: 600,
    title: 'MediFlow',
    backgroundColor: '#0d1117',
    show: false,
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      webSecurity:      false,
      devTools:         false,
      // Preload : expose window.electronAPI au renderer
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  Menu.setApplicationMenu(null);

  const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.maximize();

    // Vérifier les mises à jour 5 secondes après le démarrage
    // (laisser l'app se charger d'abord)
    setTimeout(() => checkForUpdates(mainWindow), 5000);
  });

  // Liens http/https → navigateur système
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─────────────────────────────────────────────────────────────
//  Handlers IPC
// ─────────────────────────────────────────────────────────────

// Le médecin clique "Télécharger" → ouvre le lien dans le navigateur
ipcMain.on('open-external', (_, url) => {
  if (url && url.startsWith('http')) shell.openExternal(url);
});

// Bouton "Vérifier maintenant" dans les paramètres
ipcMain.on('check-updates', () => {
  if (mainWindow) checkForUpdates(mainWindow);
});

// Retourner la version courante de l'app
ipcMain.handle('get-version', () => app.getVersion());

// ─────────────────────────────────────────────────────────────
//  Lifecycle
// ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
