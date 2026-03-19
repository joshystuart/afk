import { Tray, Menu, nativeImage, app } from 'electron';
import { getResourcePath } from './paths';
import { getMainWindow, createWindow } from './window';
import { isServerRunning } from './server';

let tray: Tray | null = null;
let isQuitting = false;

export function getIsQuitting(): boolean {
  return isQuitting;
}

export function setIsQuitting(value: boolean): void {
  isQuitting = value;
}

export function createTray(): void {
  const iconPath = getResourcePath('electron', 'build', 'icon.png');
  const icon = nativeImage
    .createFromPath(iconPath)
    .resize({ width: 18, height: 18 });
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('AFK');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show AFK',
      click: showWindow,
    },
    { type: 'separator' },
    {
      label: 'Quit AFK',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', showWindow);
}

function showWindow(): void {
  const window = getMainWindow();
  if (window) {
    window.show();
    window.focus();
  } else if (isServerRunning()) {
    createWindow();
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
