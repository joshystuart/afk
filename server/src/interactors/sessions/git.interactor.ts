import { Injectable, Logger } from '@nestjs/common';
import { DockerEngineService } from '../../services/docker/docker-engine.service';
import { SessionRepository } from '../../services/repositories/session.repository';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionStatus } from '../../domain/sessions/session-status.enum';

export interface GitStatusResult {
  hasChanges: boolean;
  changedFileCount: number;
  branch: string;
}

export interface CommitAndPushResult {
  success: boolean;
  message: string;
}

@Injectable()
export class GitInteractor {
  private readonly logger = new Logger(GitInteractor.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async getGitStatus(sessionId: SessionIdDto): Promise<GitStatusResult> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== SessionStatus.RUNNING) {
      throw new Error('Session is not running');
    }

    if (!session.containerId) {
      throw new Error('Session has no associated container');
    }

    // Get changed files
    const statusResult = await this.dockerEngine.execInContainer(
      session.containerId,
      ['git', 'status', '--porcelain'],
    );

    // Get current branch
    const branchResult = await this.dockerEngine.execInContainer(
      session.containerId,
      ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
    );

    const changedFiles = statusResult.stdout
      ? statusResult.stdout.split('\n').filter((line) => line.trim().length > 0)
      : [];

    return {
      hasChanges: changedFiles.length > 0,
      changedFileCount: changedFiles.length,
      branch: branchResult.stdout || 'unknown',
    };
  }

  async commitAndPush(
    sessionId: SessionIdDto,
    message: string,
  ): Promise<CommitAndPushResult> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.status !== SessionStatus.RUNNING) {
      throw new Error('Session is not running');
    }

    if (!session.containerId) {
      throw new Error('Session has no associated container');
    }

    if (!message || message.trim().length === 0) {
      throw new Error('Commit message is required');
    }

    const containerId = session.containerId;

    try {
      // Stage all changes
      const addResult = await this.dockerEngine.execInContainer(containerId, [
        'git',
        'add',
        '-A',
      ]);

      if (addResult.exitCode !== 0) {
        this.logger.error('git add failed', { stderr: addResult.stderr });
        return {
          success: false,
          message: `Failed to stage changes: ${addResult.stderr}`,
        };
      }

      // Commit
      const commitResult = await this.dockerEngine.execInContainer(
        containerId,
        ['git', 'commit', '-m', message.trim()],
      );

      if (commitResult.exitCode !== 0) {
        this.logger.error('git commit failed', {
          stderr: commitResult.stderr,
        });
        return {
          success: false,
          message: `Failed to commit: ${commitResult.stderr || commitResult.stdout}`,
        };
      }

      // Push
      const pushResult = await this.dockerEngine.execInContainer(containerId, [
        'git',
        'push',
      ]);

      if (pushResult.exitCode !== 0) {
        this.logger.error('git push failed', { stderr: pushResult.stderr });
        return {
          success: false,
          message: `Failed to push: ${pushResult.stderr}`,
        };
      }

      this.logger.log('Commit and push successful', {
        sessionId: sessionId.toString(),
        commitOutput: commitResult.stdout,
      });

      return {
        success: true,
        message: commitResult.stdout,
      };
    } catch (error) {
      this.logger.error('Commit and push failed', {
        sessionId: sessionId.toString(),
        error: error.message,
      });
      return {
        success: false,
        message: `Operation failed: ${error.message}`,
      };
    }
  }
}
