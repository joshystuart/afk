import { autoUpdater } from 'electron-updater';
import { app, dialog, BrowserWindow } from 'electron';
import { getMainWindow } from './window';
import { rebuildTrayMenu } from './tray';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error';

interface UpdateState {
  status: UpdateStatus;
  version?: string;
  error?: string;
  progress?: number;
}

let updateState: UpdateState = { status: 'idle' };

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

export function getUpdateState(): UpdateState {
  return updateState;
}

export function initAutoUpdater(): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    updateState = { status: 'checking' };
    notifyRenderer();
  });

  autoUpdater.on('update-available', (info) => {
    updateState = { status: 'available', version: info.version };
    notifyRenderer();
  });

  autoUpdater.on('update-not-available', () => {
    updateState = { status: 'not-available' };
    notifyRenderer();
  });

  autoUpdater.on('download-progress', (progress) => {
    updateState = {
      status: 'downloading',
      progress: Math.round(progress.percent),
    };
    notifyRenderer();
  });

  autoUpdater.on('update-downloaded', (info) => {
    updateState = { status: 'downloaded', version: info.version };
    notifyRenderer();
    promptInstall(info.version);
  });

  autoUpdater.on('error', (err) => {
    updateState = { status: 'error', error: err.message };
    notifyRenderer();
  });

  // Initial check after a short delay to let the app finish starting
  setTimeout(() => checkForUpdates(), 10_000);

  // Periodic checks
  setInterval(() => checkForUpdates(), UPDATE_CHECK_INTERVAL_MS);
}

export function checkForUpdates(): void {
  if (!app.isPackaged) {
    return;
  }
  autoUpdater.checkForUpdates().catch((err: unknown) => {
    console.error('Auto-update check failed:', err);
  });
}

export function quitAndInstall(): void {
  autoUpdater.quitAndInstall();
}

function notifyRenderer(): void {
  rebuildTrayMenu();
  const window = getMainWindow();
  if (window && !window.isDestroyed()) {
    window.webContents.send('updater:state-changed', updateState);
  }
}

function promptInstall(version: string): void {
  const window = getMainWindow();
  const parent: BrowserWindow | undefined = window && !window.isDestroyed()
    ? window
    : undefined;

  dialog
    .showMessageBox({
      ...(parent ? { parent } : {}),
      type: 'info',
      title: 'Update Ready',
      message: `AFK v${version} has been downloaded.`,
      detail: 'Restart now to apply the update?',
      buttons: ['Restart', 'Later'],
      defaultId: 0,
      cancelId: 1,
    })
    .then(({ response }) => {
      if (response === 0) {
        quitAndInstall();
      }
    });
}
