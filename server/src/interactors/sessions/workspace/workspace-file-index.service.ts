import { Injectable, Logger } from '@nestjs/common';
import ignore from 'ignore';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';

const INDEX_TTL_MS = 60_000;
const MAX_INDEX_SIZE = 10_000;

interface FileIndexCacheEntry {
  files: string[];
  timestamp: number;
}

@Injectable()
export class WorkspaceFileIndexService {
  private readonly logger = new Logger(WorkspaceFileIndexService.name);
  private readonly fileIndexCache = new Map<string, FileIndexCacheEntry>();

  constructor(private readonly execService: DockerEngineService) {}

  async getFileIndex(
    containerId: string,
    workingDir: string,
  ): Promise<string[]> {
    const cached = this.fileIndexCache.get(containerId);
    const now = Date.now();

    if (cached && now - cached.timestamp < INDEX_TTL_MS) {
      return cached.files;
    }

    const files = await this.buildIndex(containerId, workingDir);
    const capped = files.slice(0, MAX_INDEX_SIZE);

    this.fileIndexCache.set(containerId, {
      files: capped,
      timestamp: now,
    });

    this.logger.debug('File index built', {
      containerId,
      count: capped.length,
      truncated: files.length > MAX_INDEX_SIZE,
    });

    return capped;
  }

  invalidateIndex(containerId: string): void {
    this.fileIndexCache.delete(containerId);
  }

  clearAllIndexes(): void {
    this.fileIndexCache.clear();
  }

  private async buildIndex(
    containerId: string,
    workingDir: string,
  ): Promise<string[]> {
    const gitResult = await this.execService.execInContainer(
      containerId,
      ['git', 'ls-files', '--cached', '--others', '--exclude-standard'],
      workingDir,
    );

    if (gitResult.exitCode === 0) {
      return gitResult.stdout
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    this.logger.debug('git ls-files failed, falling back to find', {
      containerId,
      stderr: gitResult.stderr,
    });

    const findResult = await this.execService.execInContainer(
      containerId,
      ['find', '.', '-type', 'f', '-not', '-path', './.git/*'],
      workingDir,
    );

    if (findResult.exitCode !== 0) {
      this.logger.warn('File index fallback failed', {
        containerId,
        stderr: findResult.stderr,
      });
      return [];
    }

    const raw = findResult.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => (line.startsWith('./') ? line.slice(2) : line));

    const gitignoreResult = await this.execService.execInContainer(
      containerId,
      ['cat', '.gitignore'],
      workingDir,
    );

    if (gitignoreResult.exitCode !== 0 || !gitignoreResult.stdout) {
      return raw;
    }

    const ig = ignore().add(gitignoreResult.stdout);
    return raw.filter((p) => !ig.ignores(p));
  }
}
