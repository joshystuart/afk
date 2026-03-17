import { app, dialog } from 'electron';
import { SERVER_PORT } from './paths';
import { setLoadingStatus } from './loading-screen';
import { configureElectronEnvironment } from './environment';
import { startServer, stopServer, isServerRunning } from './server';
import { createWindow, getMainWindow } from './window';

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (getMainWindow() === null && isServerRunning()) {
    createWindow();
  }
});

app.whenReady().then(async () => {
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
    app.quit();
  }
});

app.on('before-quit', async () => {
  await stopServer();
});
