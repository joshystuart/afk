import * as path from 'path';
import * as os from 'os';

const FORBIDDEN_PATHS = new Set([
  '/',
  '/etc',
  '/var',
  '/usr',
  '/bin',
  '/sbin',
  '/lib',
  '/System',
  '/Applications',
  '/tmp',
  '/dev',
  '/proc',
  '/sys',
]);

export class MountPathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MountPathValidationError';
  }
}

export function validateMountPath(mountPath: string): string {
  if (!mountPath || mountPath.trim() === '') {
    throw new MountPathValidationError('Mount path cannot be empty');
  }

  const resolved = path.resolve(mountPath.trim());

  if (FORBIDDEN_PATHS.has(resolved)) {
    throw new MountPathValidationError(
      `Mount path "${resolved}" is a protected system directory`,
    );
  }

  const homeDir = os.homedir();
  if (resolved === homeDir) {
    throw new MountPathValidationError(
      `Mount path cannot be the home directory root. Use a subdirectory like "${homeDir}/workspaces"`,
    );
  }

  const parts = resolved.split(path.sep).filter(Boolean);
  if (parts.length < 2) {
    throw new MountPathValidationError(
      'Mount path must be at least 2 levels deep from root',
    );
  }

  return resolved;
}
