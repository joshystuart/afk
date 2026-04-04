import { app, dialog, ipcMain } from 'electron';
import { SERVER_PORT } from './paths';
import { setLoadingStatus } from './loading-screen';
import { configureElectronEnvironment } from './environment';
import { startServer, stopServer, isServerRunning } from './server';
import { createWindow, getMainWindow } from './window';
import {
  createTray,
  setIsQuitting,
  destroyTray,
  updateTrayState,
} from './tray';

ipcMain.on('tray:update-state', (_event, state) => {
  updateTrayState(state as Parameters<typeof updateTrayState>[0]);
});

app.on('window-all-closed', () => {
  // On macOS, keep the app alive in the tray when all windows are closed.
  // On other platforms, quit as usual.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  const window = getMainWindow();
  if (window) {
    window.show();
    window.focus();
  } else if (isServerRunning()) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  createTray();
  createWindow();

  setLoadingStatus(getMainWindow(), 'Starting server\u2026');
  configureElectronEnvironment();

  try {
    await startServer();
    getMainWindow()?.loadURL(`http://localhost:${SERVER_PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    const window = getMainWindow();
    if (window) {
      await dialog.showMessageBox(window, {
        type: 'error',
        title: 'Startup Error',
        message: 'Failed to start the AFK server.',
        detail: String(error),
      });
    }
    setIsQuitting(true);
    app.quit();
  }
});

app.on('before-quit', async () => {
  setIsQuitting(true);
  destroyTray();
  await stopServer();
});
