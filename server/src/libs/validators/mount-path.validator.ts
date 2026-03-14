import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { Injectable } from '@nestjs/common';
import { MountPathValidationError } from './mount-path-validation.error';

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

@Injectable()
export class MountPathValidator {
  validate(mountPath: string): string {
    if (!mountPath || mountPath.trim() === '') {
      throw new MountPathValidationError('Mount path cannot be empty');
    }

    const resolved = path.resolve(mountPath.trim());
    this.assertPathWithinBoundaries(resolved);
    return resolved;
  }

  /**
   * After the directory has been created on disk, re-validate by resolving
   * symlinks to ensure the real path is still within allowed boundaries.
   * This prevents symlink-based path traversal attacks where a symlink at
   * an intermediate path component redirects to a protected directory.
   */
  validateReal(mountPath: string): string {
    const realPath = fs.realpathSync(mountPath);
    this.assertPathWithinBoundaries(realPath);
    return realPath;
  }

  private assertPathWithinBoundaries(resolved: string): void {
    if (FORBIDDEN_PATHS.has(resolved)) {
      throw new MountPathValidationError(
        `Mount path "${resolved}" is a protected system directory`,
      );
    }

    for (const forbidden of FORBIDDEN_PATHS) {
      if (forbidden !== '/' && resolved.startsWith(forbidden + path.sep)) {
        throw new MountPathValidationError(
          `Mount path "${resolved}" is inside protected system directory "${forbidden}"`,
        );
      }
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
  }
}
