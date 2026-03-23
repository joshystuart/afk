import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DockerEngineService } from '../docker/docker-engine.service';
import { GitService, GitStatusResult } from '../git/git.service';

interface WatcherState {
  kill: () => Promise<void>;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  lastStatus: GitStatusResult | null;
  containerId: string;
}

@Injectable()
export class GitWatcherService {
  private readonly logger = new Logger(GitWatcherService.name);
  private watchers = new Map<string, WatcherState>();

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly gitService: GitService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async startWatching(sessionId: string, containerId: string): Promise<void> {
    if (this.watchers.has(sessionId)) {
      this.logger.debug('Already watching session', { sessionId });
      return;
    }

    this.logger.log('Starting git watcher', { sessionId, containerId });

    const repoReady = await this.waitForRepoDir(containerId);
    if (!repoReady) {
      this.logger.warn(
        'Repo directory not ready after waiting, skipping git watcher',
        { sessionId },
      );
      return;
    }

    try {
      const { kill } = await this.dockerEngine.execStreamInContainer(
        containerId,
        [
          'inotifywait',
          '-m',
          '-r',
          '-e',
          'modify,create,delete,move',
          '--exclude',
          '(node_modules|\\.git/objects|\\.git/logs)',
          '/workspace/repo/.git',
          '/workspace/repo',
        ],
        (data: string) => {
          this.handleInotifyEvent(sessionId, data);
        },
      );

      const state: WatcherState = {
        kill,
        debounceTimer: null,
        lastStatus: null,
        containerId,
      };

      this.watchers.set(sessionId, state);

      await this.fetchAndEmitStatus(sessionId, containerId);

      this.logger.log('Git watcher started', { sessionId });
    } catch (error) {
      this.logger.warn(
        'Failed to start git watcher (inotifywait may not be available)',
        {
          sessionId,
          error: error.message,
        },
      );
    }
  }

  async stopWatching(sessionId: string): Promise<void> {
    const state = this.watchers.get(sessionId);
    if (!state) {
      return;
    }

    this.logger.log('Stopping git watcher', { sessionId });

    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    await state.kill();

    this.watchers.delete(sessionId);

    this.logger.log('Git watcher stopped', { sessionId });
  }

  isWatching(sessionId: string): boolean {
    return this.watchers.has(sessionId);
  }

  private async waitForRepoDir(
    containerId: string,
    maxAttempts = 15,
  ): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await this.dockerEngine.execInContainer(
          containerId,
          ['test', '-d', '/workspace/repo/.git'],
          '/workspace',
        );
        if (result.exitCode === 0) {
          return true;
        }
      } catch {
        // Container or exec failed, keep retrying
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    return false;
  }

  private handleInotifyEvent(sessionId: string, _data: string): void {
    const state = this.watchers.get(sessionId);
    if (!state) {
      return;
    }

    if (state.debounceTimer) {
      clearTimeout(state.debounceTimer);
    }

    state.debounceTimer = setTimeout(() => {
      this.fetchAndEmitStatus(sessionId, state.containerId).catch((error) => {
        this.logger.warn('Failed to fetch git status after inotify event', {
          sessionId,
          error: error.message,
        });
      });
    }, 2000);
  }

  private async fetchAndEmitStatus(
    sessionId: string,
    containerId: string,
  ): Promise<void> {
    try {
      const newStatus = await this.gitService.getStatus(containerId);

      const state = this.watchers.get(sessionId);
      if (state && !this.isStatusEqual(state.lastStatus, newStatus)) {
        state.lastStatus = newStatus;
        this.eventEmitter.emit('git.status.changed', {
          sessionId,
          status: newStatus,
        });

        this.logger.debug('Git status changed', { sessionId, ...newStatus });
      }
    } catch (error) {
      this.logger.warn('Failed to fetch git status', {
        sessionId,
        error: error.message,
      });
    }
  }

  private isStatusEqual(
    a: GitStatusResult | null,
    b: GitStatusResult,
  ): boolean {
    if (!a) return false;
    return (
      a.hasChanges === b.hasChanges &&
      a.changedFileCount === b.changedFileCount &&
      a.branch === b.branch
    );
  }
}
