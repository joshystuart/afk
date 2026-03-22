import { Inject, Injectable, Logger } from '@nestjs/common';
import { ScheduledJob } from '../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRun } from '../../domain/scheduled-jobs/scheduled-job-run.entity';
import { DockerEngineService } from '../docker/docker-engine.service';
import { PortManagerService } from '../docker/port-manager.service';
import { DockerImageRepository } from '../../domain/docker-images/docker-image.repository';
import { DockerImageStatus } from '../../domain/docker-images/docker-image-status.enum';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';
import { EphemeralContainerCreateOptions } from '../../domain/containers/container.entity';
import { PortPairDto } from '../../domain/containers/port-pair.dto';

const MAX_CONTAINER_START_RETRIES = 3;
const CONTAINER_RETRY_BASE_DELAY_MS = 5_000;

export interface PreparedScheduledJobRuntime {
  branchName: string;
  containerId: string;
  ports: PortPairDto;
}

@Injectable()
export class ScheduledJobRuntimeService {
  private readonly logger = new Logger(ScheduledJobRuntimeService.name);

  constructor(
    private readonly dockerEngine: DockerEngineService,
    private readonly portManager: PortManagerService,
    private readonly dockerImageRepository: DockerImageRepository,
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async prepare(
    job: ScheduledJob,
    run: ScheduledJobRun,
  ): Promise<PreparedScheduledJobRuntime> {
    const dockerImage = await this.dockerImageRepository.findById(job.imageId);
    if (!dockerImage) {
      throw new Error(`Docker image not found: ${job.imageId}`);
    }
    if (dockerImage.status !== DockerImageStatus.AVAILABLE) {
      throw new Error(
        `Docker image "${dockerImage.name}" is not available (status: ${dockerImage.status})`,
      );
    }

    await this.dockerEngine.waitForDockerReady();

    const ports = await this.portManager.allocatePortPair();
    try {
      const settings = await this.settingsRepository.get();
      const branchName = this.resolveBranchName(job);
      const githubToken = this.resolveGithubToken(job.repoUrl, settings);

      const containerCreateOptions: EphemeralContainerCreateOptions = {
        jobId: job.id,
        runId: run.id,
        imageName: dockerImage.image,
        repoUrl: job.repoUrl,
        branch: job.createNewBranch ? job.branch : branchName,
        gitUserName: settings.git.userName || 'AFK Bot',
        gitUserEmail: settings.git.userEmail || 'bot@afk.local',
        sshPrivateKey: settings.git.sshPrivateKey,
        ports,
        claudeToken: settings.general.claudeToken,
        githubToken,
      };

      const containerId = await this.createContainerWithRetries(
        containerCreateOptions,
      );
      return {
        branchName,
        containerId,
        ports,
      };
    } catch (error) {
      await this.portManager.releasePortPair(ports).catch(() => {});
      throw error;
    }
  }

  private async createContainerWithRetries(
    options: EphemeralContainerCreateOptions,
  ): Promise<string> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_CONTAINER_START_RETRIES; attempt++) {
      let containerId: string | null = null;

      try {
        const container =
          await this.dockerEngine.createEphemeralContainer(options);
        containerId = container.id;

        this.logger.log('Waiting for container to be ready', {
          jobId: options.jobId,
          runId: options.runId,
          containerId,
          attempt,
        });
        await this.dockerEngine.waitForContainerReady(containerId);
        this.logger.log('Container is ready', {
          jobId: options.jobId,
          runId: options.runId,
          attempt,
        });

        return containerId;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn('Container start attempt failed', {
          jobId: options.jobId,
          runId: options.runId,
          attempt,
          maxAttempts: MAX_CONTAINER_START_RETRIES,
          error: lastError.message,
        });

        if (containerId) {
          await this.dockerEngine.removeContainer(containerId).catch(() => {});
        }

        if (attempt < MAX_CONTAINER_START_RETRIES) {
          const delayMs = CONTAINER_RETRY_BASE_DELAY_MS * attempt;
          this.logger.log('Retrying container creation', {
            jobId: options.jobId,
            runId: options.runId,
            nextAttemptIn: `${delayMs}ms`,
          });
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          await this.dockerEngine.waitForDockerReady();
        }
      }
    }

    throw lastError ?? new Error('Container creation failed after retries');
  }

  private resolveBranchName(job: ScheduledJob): string {
    if (!job.createNewBranch || !job.newBranchPrefix) {
      return job.branch;
    }

    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp = [
      now.getFullYear(),
      '-',
      pad(now.getMonth() + 1),
      '-',
      pad(now.getDate()),
      '-',
      pad(now.getHours()),
      pad(now.getMinutes()),
      pad(now.getSeconds()),
    ].join('');

    return `${job.newBranchPrefix}-${timestamp}`;
  }

  private resolveGithubToken(
    repoUrl: string,
    settings: Awaited<ReturnType<SettingsRepository['get']>>,
  ): string | undefined {
    const isGitHubHttpsUrl = repoUrl.startsWith('https://github.com');
    return isGitHubHttpsUrl && settings.git.githubAccessToken
      ? settings.git.githubAccessToken
      : undefined;
  }
}
