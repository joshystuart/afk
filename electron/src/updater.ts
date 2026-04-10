import { autoUpdater } from 'electron-updater';
import { app } from 'electron';
import { getMainWindow, setUpdateInstalling } from './window';
import { rebuildTrayMenu, setIsQuitting } from './tray';

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'restarting'
  | 'error';

export interface UpdateState {
  status: UpdateStatus;
  version?: string;
  error?: string;
  progress?: number;
}

let updateState: UpdateState = { status: 'idle' };
let updateCheckRetries = 0;

// How often to check for updates (1 hour)
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
// Maximum number of retries before giving up on an update check
const MAX_UPDATE_RETRIES = 3;
// Initial delay before first retry (subsequent retries use exponential backoff)
const INITIAL_RETRY_DELAY_MS = 30_000;

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
    updateCheckRetries = 0; // Reset on success
    updateState = { status: 'available', version: info.version };
    notifyRenderer();
  });

  autoUpdater.on('update-not-available', () => {
    updateCheckRetries = 0; // Reset on success
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
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
    const wasRestarting = updateState.status === 'restarting';
    updateState = {
      status: 'error',
      error: sanitizeErrorMessage(err.message),
    };
    notifyRenderer();

    if (wasRestarting) {
      restartScheduled = false;
      setUpdateInstalling(false);
      setIsQuitting(false);
    }
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
    updateCheckRetries++;

    if (updateCheckRetries < MAX_UPDATE_RETRIES) {
      const retryDelay = INITIAL_RETRY_DELAY_MS * updateCheckRetries;
      console.log(
        `Retrying update check in ${retryDelay / 1000}s (attempt ${updateCheckRetries + 1}/${MAX_UPDATE_RETRIES})`,
      );
      setTimeout(() => checkForUpdates(), retryDelay);
    } else {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      updateState = {
        status: 'error',
        error: sanitizeErrorMessage(
          `Update check failed after ${MAX_UPDATE_RETRIES} attempts: ${errorMessage}`,
        ),
      };
      notifyRenderer();
      updateCheckRetries = 0; // Reset for next periodic check
    }
  });
}

// Gives the renderer enough time to paint the "restarting" overlay before the
// main process triggers the quit-and-install sequence.
const OVERLAY_RENDER_DELAY_MS = 500;

let restartScheduled = false;

export function quitAndInstall(): void {
  if (restartScheduled) {
    return;
  }
  restartScheduled = true;

  updateState = { status: 'restarting', version: updateState.version };
  notifyRenderer();

  setUpdateInstalling(true);

  setTimeout(() => {
    setIsQuitting(true);
    autoUpdater.quitAndInstall(false, true);
  }, OVERLAY_RENDER_DELAY_MS);
}

function notifyRenderer(): void {
  rebuildTrayMenu();
  const window = getMainWindow();
  if (window && !window.isDestroyed()) {
    window.webContents.send('updater:state-changed', updateState);
  }
}

const SENSITIVE_PATTERNS = [/\/Users\/[^\s/]+/gi, /\/home\/[^\s/]+/gi];

function sanitizeErrorMessage(message: string): string {
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '<path>');
  }
  return sanitized;
}
