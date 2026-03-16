import { BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { isDev, getResourcePath } from './paths';
import { getLoadingURL } from './loading-screen';

let mainWindow: BrowserWindow | null = null;

ipcMain.handle('open-external', (_event, url: string) => {
  return shell.openExternal(url);
});

export function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'AFK',
    icon: getResourcePath('electron', 'build', 'icon.png'),
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    show: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(getLoadingURL());

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.includes('/api/github/auth')) {
      event.preventDefault();
      const electronUrl = url.includes('?')
        ? `${url}&source=electron`
        : `${url}?source=electron`;
      shell.openExternal(electronUrl);
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
