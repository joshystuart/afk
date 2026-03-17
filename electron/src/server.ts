import type { INestApplication } from '@nestjs/common';
import * as path from 'path';
import { getResourcePath, SERVER_PORT } from './paths';

let serverApp: INestApplication | null = null;

export async function startServer(): Promise<void> {
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

export async function stopServer(): Promise<void> {
  if (serverApp) {
    await serverApp.close();
    serverApp = null;
  }
}

export function isServerRunning(): boolean {
  return serverApp !== null;
}
