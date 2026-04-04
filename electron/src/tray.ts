import type { MenuItemConstructorOptions } from 'electron';
import { Tray, Menu, nativeImage, app } from 'electron';
import { getResourcePath, SERVER_PORT } from './paths';
import { getMainWindow, createWindow } from './window';
import { isServerRunning } from './server';

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

let trayState: TrayState = EMPTY_TRAY_STATE;

export function getIsQuitting(): boolean {
  return isQuitting;
}

export function setIsQuitting(value: boolean): void {
  isQuitting = value;
}

export function createTray(): void {
  const iconPath = getResourcePath('electron', 'build', 'tray-icon.png');
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 18, height: 18 });

  tray = new Tray(icon);
  tray.setToolTip('AFK');
  rebuildTrayMenu();
}

export function updateTrayState(nextState: TrayState): void {
  trayState = nextState;
  rebuildTrayMenu();
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
        void window.loadURL(targetUrl);
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
      void nextWindow.loadURL(`http://localhost:${SERVER_PORT}${route}`);
      nextWindow.show();
      nextWindow.focus();
    }
    return;
  }

  createWindow();
}

function rebuildTrayMenu(): void {
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
    ...links.slice(0, 5).map((link) => ({
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
