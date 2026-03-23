import { Inject, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import { SessionConfigDtoFactory } from '../../../domain/sessions/session-config-dto.factory';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { Settings } from '../../../domain/settings/settings.entity';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../../domain/settings/settings.tokens';
import { SessionConfig } from '../../../libs/config/session.config';
import { MountPathValidationError } from '../../../libs/validators/mount-path-validation.error';
import { MountPathValidator } from '../../../libs/validators/mount-path.validator';
import { CreateSessionRequest } from './create-session-request.dto';

export interface PreparedCreateSessionRequest {
  sessionConfig: ReturnType<SessionConfigDtoFactory['create']>;
  sessionName: string;
  settings: Settings;
}

@Injectable()
export class CreateSessionRequestService {
  private readonly logger = new Logger(CreateSessionRequestService.name);
  private readonly creationLock = new Map<string, Promise<void>>();

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: SessionRepository,
    private readonly sessionConfigFactory: SessionConfigDtoFactory,
    private readonly sessionConfig: SessionConfig,
    private readonly mountPathValidator: MountPathValidator,
  ) {}

  async prepare(
    request: CreateSessionRequest,
  ): Promise<PreparedCreateSessionRequest> {
    const sessionName =
      request.name || this.deriveSessionName(request.repoUrl, request.branch);
    const settings = await this.settingsRepository.get();

    await this.validateRequest(request, settings);

    const sessionConfig = this.sessionConfigFactory.create({
      repoUrl: request.repoUrl,
      branch: request.branch,
      gitUserName: request.gitUserName || settings.git.userName,
      gitUserEmail: request.gitUserEmail || settings.git.userEmail,
      hasSSHKey: !!settings.git.sshPrivateKey,
      mountToHost: request.mountToHost,
      hostMountPathOverride: request.hostMountPath,
      defaultMountDirectory:
        settings.general.defaultMountDirectory ?? undefined,
      cleanupOnDelete: request.cleanupOnDelete,
    });

    await this.ensureMountPathReady(sessionConfig.hostMountPath, sessionName);

    return {
      sessionConfig,
      sessionName,
      settings,
    };
  }

  private async ensureMountPathReady(
    hostMountPath: string | null,
    sessionName: string,
  ): Promise<void> {
    if (!hostMountPath) {
      return;
    }

    try {
      this.mountPathValidator.validate(hostMountPath);
    } catch (error) {
      if (error instanceof MountPathValidationError) {
        throw new Error(error.message);
      }
      throw error;
    }

    await this.withMountPathLock(hostMountPath, async () => {
      await this.checkMountPathConflict(hostMountPath);

      fs.mkdirSync(hostMountPath, { recursive: true });

      try {
        this.mountPathValidator.validateReal(hostMountPath);
      } catch (error) {
        if (error instanceof MountPathValidationError) {
          throw new Error(
            `Mount path resolved to a forbidden location after following symlinks: ${error.message}`,
          );
        }
        throw error;
      }
    });

    this.logger.log('Ensured host mount directory exists', {
      hostMountPath,
      sessionName,
    });
  }

  private async withMountPathLock<T>(
    mountPath: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    while (this.creationLock.has(mountPath)) {
      await this.creationLock.get(mountPath);
    }

    let resolve!: () => void;
    const lockPromise = new Promise<void>((r) => (resolve = r));
    this.creationLock.set(mountPath, lockPromise);

    try {
      return await fn();
    } finally {
      this.creationLock.delete(mountPath);
      resolve();
    }
  }

  private async checkMountPathConflict(hostMountPath: string): Promise<void> {
    const allSessions = await this.sessionRepository.findAll({});
    const activeSessions = allSessions.filter(
      (session) =>
        session.status !== SessionStatus.STOPPED &&
        session.status !== SessionStatus.ERROR,
    );

    const conflict = activeSessions.find(
      (session) => session.config?.hostMountPath === hostMountPath,
    );

    if (conflict) {
      throw new Error(
        `Mount path '${hostMountPath}' is already in use by session '${conflict.name}'. Use a custom path override or stop the other session.`,
      );
    }
  }

  private async validateRequest(
    request: CreateSessionRequest,
    settings: Settings,
  ): Promise<void> {
    if (request.repoUrl) {
      const hasGitHub = !!settings.git.githubAccessToken;
      const isHttpsUrl = request.repoUrl.startsWith('https://');
      const needsSshKey = !hasGitHub && !isHttpsUrl;

      if (
        needsSshKey &&
        (!settings.git.sshPrivateKey ||
          settings.git.sshPrivateKey.trim() === '')
      ) {
        throw new Error(
          'SSH Private Key is required for SSH repository URLs. Please configure it in Settings or connect GitHub for HTTPS access.',
        );
      }
    }

    if (
      !settings.general.claudeToken ||
      settings.general.claudeToken.trim() === ''
    ) {
      throw new Error(
        'Claude Token is required. Please configure it in Settings before creating a session.',
      );
    }

    const existingSessions = await this.sessionRepository.findAll({
      userId: request.userId,
    });

    if (existingSessions.length >= this.sessionConfig.maxSessionsPerUser) {
      throw new Error('Maximum session limit reached');
    }

    if (request.repoUrl && !this.isValidRepoUrl(request.repoUrl)) {
      throw new Error('Invalid repository URL format');
    }
  }

  private deriveSessionName(repoUrl?: string, branch?: string): string {
    if (!repoUrl) {
      return `session-${Date.now()}`;
    }

    let repoName: string;
    try {
      const sshMatch = repoUrl.match(/[:/]([^/]+?)(?:\.git)?$/);
      if (sshMatch) {
        repoName = sshMatch[1];
      } else {
        repoName =
          repoUrl
            .split('/')
            .pop()
            ?.replace(/\.git$/, '') || 'repo';
      }
    } catch {
      repoName = 'repo';
    }

    return `${repoName}/${branch || 'main'}`;
  }

  private isValidRepoUrl(url: string): boolean {
    const patterns = [/^https?:\/\/.+$/, /^git@.+:.+\.git$/, /^ssh:\/\/.+$/];
    return patterns.some((pattern) => pattern.test(url));
  }
}
