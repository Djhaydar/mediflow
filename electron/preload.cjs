const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose une API sécurisée à la React app (contextIsolation = true).
 * window.electronAPI est disponible dans le renderer uniquement si on est dans Electron.
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Mise à jour
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (_, data) => cb(data)),
  checkUpdates:      ()    => ipcRenderer.send('check-updates'),

  // Infos app
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Ouvrir un lien dans le navigateur système (pas dans Electron)
  openExternal: (url) => ipcRenderer.send('open-external', url),

  // Retirer les écouteurs (cleanup React)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
