import { app } from 'electron';
import { randomBytes } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

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

/**
 * Sets up process.env variables needed by the NestJS server:
 * - DB_SQLITE_DATABASE: SQLite path in Electron's userData directory
 * - AUTH_JWT_SECRET: Persisted JWT secret (generated on first run)
 */
export function configureElectronEnvironment(): void {
  const userDataPath = app.getPath('userData');
  fs.mkdirSync(userDataPath, { recursive: true });

  process.env.DB_SQLITE_DATABASE = path.join(userDataPath, 'afk.sqlite');

  const secrets = loadOrCreateSecrets();
  process.env.AUTH_JWT_SECRET = secrets.jwtSecret;
}
