import { app } from 'electron';
import * as path from 'path';

export const isDev = !app.isPackaged;
export const SERVER_PORT = 3001;

export function getResourcePath(...segments: string[]): string {
  if (isDev) {
    return path.join(__dirname, '..', '..', ...segments);
  }
  return path.join(process.resourcesPath!, ...segments);
}
