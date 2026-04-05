import { existsSync } from 'node:fs';
import type { BrowserWindow, MenuItemConstructorOptions } from 'electron';
import { Tray, Menu, nativeImage, app } from 'electron';
import { getResourcePath, SERVER_PORT } from './paths';
import { getMainWindow, createWindow } from './window';
import { isServerRunning } from './server';
import { getUpdateState, checkForUpdates, quitAndInstall } from './updater';

let tray: Tray | null = null;
let isQuitting = false;

interface TrayMenuLink {
  id: string;
  label: string;
  route: string;
}

interface TrayState {
  isAuthenticated: boolean;
  runningSessions: TrayMenuLink[];
  activeJobs: TrayMenuLink[];
  upcomingJobs: TrayMenuLink[];
}

const EMPTY_TRAY_STATE: TrayState = {
  isAuthenticated: false,
  runningSessions: [],
  activeJobs: [],
  upcomingJobs: [],
};

const TRAY_ICON_SIZE = { width: 18, height: 18 };
const MAX_TRAY_LINK_ITEMS = 5;

let trayState: TrayState = EMPTY_TRAY_STATE;

export function getIsQuitting(): boolean {
  return isQuitting;
}

export function setIsQuitting(value: boolean): void {
  isQuitting = value;
}

export function createTray(): void {
  tray = new Tray(createTrayIcon());
  tray.setToolTip('AFK');
  rebuildTrayMenu();
}

export function updateTrayState(nextState: TrayState): void {
  trayState = nextState;
  rebuildTrayMenu();
}

export function isTrayState(value: unknown): value is TrayState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as Partial<TrayState>;

  return (
    typeof state.isAuthenticated === 'boolean' &&
    isTrayMenuLinkArray(state.runningSessions) &&
    isTrayMenuLinkArray(state.activeJobs) &&
    isTrayMenuLinkArray(state.upcomingJobs)
  );
}

function showWindow(): void {
  openRoute();
}

function openRoute(route = '/dashboard'): void {
  const window = getMainWindow();
  if (window) {
    if (isServerRunning()) {
      const targetUrl = `http://localhost:${SERVER_PORT}${route}`;
      if (window.webContents.getURL() !== targetUrl) {
        loadWindowUrl(window, targetUrl);
      }
    }
    window.show();
    window.focus();
    return;
  }

  if (isServerRunning()) {
    createWindow();
    const nextWindow = getMainWindow();
    if (nextWindow) {
      loadWindowUrl(nextWindow, `http://localhost:${SERVER_PORT}${route}`);
      nextWindow.show();
      nextWindow.focus();
    }
    return;
  }

  createWindow();
}

export function rebuildTrayMenu(): void {
  if (!tray) {
    return;
  }

  tray.setContextMenu(Menu.buildFromTemplate(buildMenuTemplate()));
}

function buildMenuTemplate(): MenuItemConstructorOptions[] {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Show AFK',
      click: () => openRoute('/dashboard'),
    },
    {
      label: 'Dashboard',
      click: () => openRoute('/dashboard'),
    },
    {
      label: 'Create Session',
      click: () => openRoute('/sessions/create'),
    },
    {
      label: 'Create Job',
      click: () => openRoute('/jobs/create'),
    },
  ];

  if (trayState.isAuthenticated) {
    template.push(
      { type: 'separator' },
      {
        label: `Running Sessions (${trayState.runningSessions.length})`,
        submenu: buildRunningSessionsSubmenu(),
      },
      {
        label: `Active Jobs (${trayState.activeJobs.length})`,
        submenu: buildActiveJobsSubmenu(),
      },
      {
        label: 'Upcoming Jobs',
        submenu: buildUpcomingJobsSubmenu(),
      },
    );
  }

  template.push(
    { type: 'separator' },
    ...buildUpdateMenuItems(),
    { type: 'separator' },
    {
      label: `Version ${app.getVersion()}`,
      enabled: false,
    },
    {
      label: 'About',
      click: () => openRoute('/settings?tab=about'),
    },
    {
      label: 'Settings',
      click: () => openRoute('/settings'),
    },
    {
      label: 'Quit AFK',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  );

  return template;
}

function buildUpdateMenuItems(): MenuItemConstructorOptions[] {
  const state = getUpdateState();

  switch (state.status) {
    case 'checking':
      return [{ label: 'Checking for Updates...', enabled: false }];
    case 'downloading':
      return [
        {
          label: `Downloading Update... ${state.progress ?? 0}%`,
          enabled: false,
        },
      ];
    case 'downloaded':
      return [
        {
          label: `Restart to Update (v${state.version})`,
          click: () => quitAndInstall(),
        },
      ];
    case 'available':
      return [
        {
          label: `Update Available (v${state.version})`,
          enabled: false,
        },
      ];
    case 'error':
      return [
        {
          label: 'Check for Updates',
          click: () => checkForUpdates(),
        },
      ];
    default:
      return [
        {
          label: 'Check for Updates',
          click: () => checkForUpdates(),
        },
      ];
  }
}

function buildRunningSessionsSubmenu(): MenuItemConstructorOptions[] {
  return buildLinkSubmenu(
    trayState.runningSessions,
    'No running sessions',
    '/dashboard',
    'View All Sessions',
  );
}

function buildActiveJobsSubmenu(): MenuItemConstructorOptions[] {
  return buildLinkSubmenu(
    trayState.activeJobs,
    'No active jobs',
    '/jobs',
    'View All Jobs',
  );
}

function buildUpcomingJobsSubmenu(): MenuItemConstructorOptions[] {
  return buildLinkSubmenu(
    trayState.upcomingJobs,
    'No upcoming jobs',
    '/jobs',
    'View Scheduled Jobs',
  );
}

function buildLinkSubmenu(
  links: TrayMenuLink[],
  emptyLabel: string,
  viewAllRoute: string,
  viewAllLabel: string,
): MenuItemConstructorOptions[] {
  if (links.length === 0) {
    return [
      {
        label: emptyLabel,
        enabled: false,
      },
      { type: 'separator' },
      {
        label: viewAllLabel,
        click: () => openRoute(viewAllRoute),
      },
    ];
  }

  return [
    ...links.slice(0, MAX_TRAY_LINK_ITEMS).map((link) => ({
      label: link.label,
      click: () => openRoute(link.route),
    })),
    { type: 'separator' },
    {
      label: viewAllLabel,
      click: () => openRoute(viewAllRoute),
    },
  ];
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
  trayState = EMPTY_TRAY_STATE;
}

function createTrayIcon() {
  const trayIconPath = getResourcePath('electron', 'build', 'tray-icon.png');
  const fallbackIconPath = getResourcePath('electron', 'build', 'icon.png');

  for (const iconPath of [trayIconPath, fallbackIconPath]) {
    if (!existsSync(iconPath)) {
      continue;
    }

    const icon = nativeImage.createFromPath(iconPath).resize(TRAY_ICON_SIZE);
    if (!icon.isEmpty()) {
      if (iconPath !== trayIconPath) {
        console.warn(
          `Tray icon not found at "${trayIconPath}". Falling back to "${iconPath}".`,
        );
      }
      return icon;
    }
  }

  console.error(
    `Tray icon assets were not found at "${trayIconPath}" or "${fallbackIconPath}".`,
  );
  return nativeImage.createEmpty();
}

function isTrayMenuLink(value: unknown): value is TrayMenuLink {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const link = value as Partial<TrayMenuLink>;

  return (
    typeof link.id === 'string' &&
    typeof link.label === 'string' &&
    typeof link.route === 'string'
  );
}

function isTrayMenuLinkArray(value: unknown): value is TrayMenuLink[] {
  return Array.isArray(value) && value.every(isTrayMenuLink);
}

function loadWindowUrl(window: BrowserWindow, targetUrl: string): void {
  void window.loadURL(targetUrl).catch((error: unknown) => {
    console.error(`Failed to load tray route "${targetUrl}":`, error);
  });
}
