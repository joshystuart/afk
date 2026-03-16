import { app, BrowserWindow, dialog } from 'electron';
import type { INestApplication } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

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

function getLoadingURL(): string {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    -webkit-app-region: drag;
    user-select: none;
  }
  .container { text-align: center; }
  .logo {
    font-size: 48px;
    font-weight: 700;
    letter-spacing: 8px;
    margin-bottom: 40px;
    color: #fff;
  }
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #333;
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  #status { font-size: 13px; color: #555; }
</style></head>
<body><div class="container">
  <div class="logo">AFK</div>
  <div class="spinner"></div>
  <p id="status">Starting up\u2026</p>
</div></body></html>`;

  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function setLoadingStatus(message: string): void {
  mainWindow?.webContents
    .executeJavaScript(
      `document.getElementById('status').textContent = ${JSON.stringify(message)}`,
    )
    .catch(() => {});
}

interface PersistedSecrets {
  jwtSecret: string;
}

function getSecretsPath(): string {
  return path.join(app.getPath('userData'), 'secrets.json');
}

function loadOrCreateSecrets(): PersistedSecrets {
  const secretsPath = getSecretsPath();

  if (fs.existsSync(secretsPath)) {
    return JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
  }

  const secrets: PersistedSecrets = {
    jwtSecret: randomBytes(64).toString('hex'),
  };
  fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2), {
    mode: 0o600,
  });
  return secrets;
}

function configureElectronEnvironment(): void {
  const userDataPath = app.getPath('userData');
  fs.mkdirSync(userDataPath, { recursive: true });

  process.env.DB_SQLITE_DATABASE = path.join(userDataPath, 'afk.sqlite');

  const secrets = loadOrCreateSecrets();
  process.env.AUTH_JWT_SECRET = secrets.jwtSecret;
}

async function startServer(): Promise<void> {
  const serverDistPath = getResourcePath('server', 'dist');
  const bootstrapPath = path.join(serverDistPath, 'bootstrap');
  const webDistPath = getResourcePath('web', 'dist');

  const { bootstrapServer } = require(bootstrapPath);

  serverApp = await bootstrapServer({
    port: SERVER_PORT,
    configPath: path.join(serverDistPath, 'config'),
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

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null && serverApp) {
    createWindow();
  }
});

app.whenReady().then(async () => {
  createWindow();

  setLoadingStatus('Starting server\u2026');
  configureElectronEnvironment();

  try {
    await startServer();
    mainWindow?.loadURL(`http://localhost:${SERVER_PORT}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    await dialog.showMessageBox(mainWindow!, {
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
