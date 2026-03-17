import { BrowserWindow, ipcMain, shell } from 'electron';
import * as path from 'path';
import { isDev, getResourcePath } from './paths';
import { getLoadingURL } from './loading-screen';
import { getIsQuitting } from './tray';

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

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return {
          action: 'allow',
          overrideBrowserWindowOptions: {
            width: 960,
            height: 640,
            title: 'AFK Terminal',
            backgroundColor: '#0a0a0a',
          },
        };
      }
    } catch {
      // invalid URL, fall through to deny
    }

    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (!getIsQuitting()) {
      event.preventDefault();
      mainWindow?.hide();
      return;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}
