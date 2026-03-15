import { app, BrowserWindow, dialog, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';
import { INestApplication } from '@nestjs/common';

const isDev = !app.isPackaged;
const SERVER_PORT = 3001;

let mainWindow: BrowserWindow | null = null;
let serverApp: INestApplication | null = null;

function getResourcePath(...segments: string[]): string {
  if (isDev) {
    return path.join(__dirname, '..', '..', ...segments);
  }
  return path.join(process.resourcesPath!, ...segments);
}

function isDockerInstalled(): boolean {
  try {
    execSync('which docker', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function isDockerRunning(): boolean {
  try {
    execSync('docker info', { stdio: 'ignore', timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

async function checkDockerPrerequisite(): Promise<boolean> {
  if (!isDockerInstalled()) {
    const result = await dialog.showMessageBox({
      type: 'error',
      title: 'Docker Not Found',
      message: 'Docker Desktop is required to run AFK.',
      detail: 'Please install Docker Desktop from docker.com and try again.',
      buttons: ['Open Docker Website', 'Quit'],
      defaultId: 0,
    });

    if (result.response === 0) {
      await shell.openExternal(
        'https://www.docker.com/products/docker-desktop/',
      );
    }
    return false;
  }

  if (!isDockerRunning()) {
    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Docker Not Running',
      message: 'Docker Desktop is installed but not running.',
      detail: 'Please start Docker Desktop and click Retry.',
      buttons: ['Retry', 'Quit'],
      defaultId: 0,
    });

    if (result.response === 0) {
      return checkDockerPrerequisite();
    }
    return false;
  }

  return true;
}

function configureElectronEnvironment(): void {
  const userDataPath = app.getPath('userData');
  fs.mkdirSync(userDataPath, { recursive: true });

  process.env.DB_DATABASE = path.join(userDataPath, 'afk.sqlite');
}

async function startServer(): Promise<void> {
  const serverDistPath = getResourcePath('server', 'dist');
  const bootstrapPath = path.join(serverDistPath, 'bootstrap');
  const webDistPath = getResourcePath('web', 'dist');

  const { bootstrapServer } = require(bootstrapPath);

  serverApp = await bootstrapServer({
    port: SERVER_PORT,
    staticAssetsPath: webDistPath,
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'AFK',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null && serverApp) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  const dockerReady = await checkDockerPrerequisite();
  if (!dockerReady) {
    app.quit();
    return;
  }

  configureElectronEnvironment();

  try {
    await startServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start server:', error);
    await dialog.showMessageBox({
      type: 'error',
      title: 'Startup Error',
      message: 'Failed to start the AFK server.',
      detail: String(error),
    });
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (serverApp) {
    await serverApp.close();
    serverApp = null;
  }
});
