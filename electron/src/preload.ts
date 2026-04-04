import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type { UpdateState } from './updater';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  updateTrayState: (state: unknown) =>
    ipcRenderer.send('tray:update-state', state),
  updater: {
    checkForUpdates: () => ipcRenderer.invoke('updater:check'),
    install: () => ipcRenderer.invoke('updater:install'),
    getState: () => ipcRenderer.invoke('updater:get-state'),
    onStateChanged: (callback: (state: UpdateState) => void) => {
      const handler = (_event: IpcRendererEvent, state: UpdateState) =>
        callback(state);
      ipcRenderer.on('updater:state-changed', handler);
      return () => {
        ipcRenderer.removeListener('updater:state-changed', handler);
      };
    },
  },
});
