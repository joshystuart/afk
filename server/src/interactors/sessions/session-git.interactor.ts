import { Inject, Injectable, Logger } from '@nestjs/common';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../domain/sessions/session.repository';
import { SessionStatus } from '../../domain/sessions/session-status.enum';
import { SESSION_REPOSITORY } from '../../domain/sessions/session.tokens';
import {
  GitCommitAndPushResult,
  GitService,
  GitStatusResult,
} from '../../libs/git/git.service';

export type { GitStatusResult } from '../../libs/git/git.service';

export interface CommitAndPushResult {
  success: boolean;
  message: string;
}

@Injectable()
export class SessionGitInteractor {
  private readonly logger = new Logger(SessionGitInteractor.name);

  constructor(
    private readonly gitService: GitService,
    @Inject(SESSION_REPOSITORY)
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

    try {
      return await this.gitService.getStatus(session.containerId);
    } catch (error) {
      this.logger.debug(
        'Git status not available yet (repo may still be initializing)',
        { sessionId: sessionId.toString(), error: error.message },
      );
      return {
        hasChanges: false,
        changedFileCount: 0,
        branch: '',
      };
    }
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
      const result = await this.gitService.commitAndPush(containerId, {
        message,
      });

      if (!result.committed) {
        return {
          success: false,
          message: this.getCommitFailureMessage(result),
        };
      }

      if (!result.pushed) {
        return {
          success: false,
          message: `Failed to push: ${result.pushError}`,
        };
      }

      this.logger.log('Commit and push successful', {
        sessionId: sessionId.toString(),
        commitSha: result.commitSha,
      });

      return {
        success: true,
        message: result.commitSha
          ? `Changes committed and pushed (${result.commitSha})`
          : 'Changes committed and pushed',
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

  private getCommitFailureMessage(result: GitCommitAndPushResult): string {
    if (!result.commitError && result.filesChanged === 0) {
      return 'No changes to commit';
    }

    return `Failed to commit: ${result.commitError ?? 'Unknown git commit error'}`;
  }
}
