import { Injectable, Logger, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';
import { ScheduledJobRepository } from '../../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRunRepository } from '../../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRun } from '../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunStatus } from '../../domain/scheduled-jobs/scheduled-job-run-status.enum';
import { DockerEngineService } from '../docker/docker-engine.service';
import { PortManagerService } from '../docker/port-manager.service';
import { DockerImageRepository } from '../../domain/docker-images/docker-image.repository';
import { DockerImageStatus } from '../../domain/docker-images/docker-image-status.enum';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';
import {
  ClaudeStreamExecutionError,
  ClaudeStreamRunnerService,
} from '../chat/claude-stream-runner.service';
import { PortPairDto } from '../../domain/containers/port-pair.dto';
import { EphemeralContainerCreateOptions } from '../../domain/containers/container.entity';
import { GitService } from '../git/git.service';

const DEDUP_WINDOW_MS = 60_000;
const WORKSPACE_DIR = '/workspace/repo';
const MAX_CONTAINER_START_RETRIES = 3;
const CONTAINER_RETRY_BASE_DELAY_MS = 5_000;

export const JOB_RUN_EVENTS = {
  started: 'job.run.started',
  updated: 'job.run.updated',
  stream: 'job.run.stream',
  completed: 'job.run.completed',
  failed: 'job.run.failed',
} as const;

@Injectable()
export class JobExecutorService {
  private readonly logger = new Logger(JobExecutorService.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
    private readonly dockerEngine: DockerEngineService,
    private readonly portManager: PortManagerService,
    private readonly dockerImageRepository: DockerImageRepository,
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly claudeStreamRunner: ClaudeStreamRunnerService,
    private readonly gitService: GitService,
  ) {}

  async execute(
    jobId: string,
    options: { ignoreEnabled?: boolean } = {},
  ): Promise<void> {
    const job = await this.scheduledJobRepository.findById(jobId);
    if (!job) {
      this.logger.warn('Job not found, skipping execution', { jobId });
      return;
    }
    if (!job.enabled && !options.ignoreEnabled) {
      this.logger.log('Job is disabled, skipping execution', { jobId });
      return;
    }

    const recentRuns = await this.scheduledJobRunRepository.findRecentByJobId(
      jobId,
      DEDUP_WINDOW_MS,
    );
    if (recentRuns.length > 0) {
      this.logger.log('Dedup: recent run found, skipping', {
        jobId,
        recentRunId: recentRuns[0].id,
      });
      return;
    }

    const run = new ScheduledJobRun();
    run.id = uuidv4();
    run.jobId = jobId;
    run.status = ScheduledJobRunStatus.PENDING;
    run.branch = job.branch;
    run.committed = false;
    run.streamEvents = [];
    await this.scheduledJobRunRepository.save(run);

    this.eventEmitter.emit(JOB_RUN_EVENTS.started, {
      jobId,
      runId: run.id,
    });
    this.eventEmitter.emit(JOB_RUN_EVENTS.updated, {
      jobId,
      runId: run.id,
    });

    let ports: PortPairDto | null = null;

    try {
      run.markRunning();
      await this.scheduledJobRunRepository.save(run);
      this.eventEmitter.emit(JOB_RUN_EVENTS.updated, {
        jobId,
        runId: run.id,
      });

      const dockerImage = await this.dockerImageRepository.findById(
        job.imageId,
      );
      if (!dockerImage) {
        throw new Error(`Docker image not found: ${job.imageId}`);
      }
      if (dockerImage.status !== DockerImageStatus.AVAILABLE) {
        throw new Error(
          `Docker image "${dockerImage.name}" is not available (status: ${dockerImage.status})`,
        );
      }

      await this.dockerEngine.waitForDockerReady();

      ports = await this.portManager.allocatePortPair();

      const settings = await this.settingsRepository.get();

      let branchName = job.branch;
      if (job.createNewBranch && job.newBranchPrefix) {
        branchName = this.generateBranchName(job.newBranchPrefix);
      }
      run.branch = branchName;

      const isGitHubHttpsUrl = job.repoUrl.startsWith('https://github.com');
      const githubToken =
        isGitHubHttpsUrl && settings.git.githubAccessToken
          ? settings.git.githubAccessToken
          : undefined;

      const containerCreateOptions = {
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

      const container = await this.createContainerWithRetries(
        containerCreateOptions,
        run,
      );

      run.containerId = container.id;
      await this.scheduledJobRunRepository.save(run);
      this.eventEmitter.emit(JOB_RUN_EVENTS.updated, {
        jobId,
        runId: run.id,
      });

      if (job.createNewBranch) {
        this.logger.log('Creating new branch', {
          jobId,
          runId: run.id,
          branchName,
        });
        await this.gitService.createBranch(
          container.id,
          branchName,
          WORKSPACE_DIR,
        );
      }

      this.logger.log('Executing Claude prompt', {
        jobId,
        runId: run.id,
        promptLength: job.prompt.length,
      });
      const streamResult = await this.runClaudePrompt(
        container.id,
        run.id,
        jobId,
        job.prompt,
        job.model,
      );
      run.streamEvents = streamResult.streamEvents;

      if (job.commitAndPush) {
        const commitResult = await this.gitService.commitAndPush(container.id, {
          message: 'AFK scheduled job: automated changes',
          branchName,
          workingDir: WORKSPACE_DIR,
        });
        run.committed = commitResult.committed;
        run.filesChanged = commitResult.filesChanged;
        run.commitSha = commitResult.commitSha;
      }

      run.markCompleted();
      await this.scheduledJobRunRepository.save(run);
      this.eventEmitter.emit(JOB_RUN_EVENTS.updated, {
        jobId,
        runId: run.id,
      });

      job.recordRun(new Date());
      await this.scheduledJobRepository.save(job);
      this.eventEmitter.emit(JOB_RUN_EVENTS.updated, {
        jobId,
        runId: run.id,
      });

      this.logger.log('Job run completed successfully', {
        jobId,
        runId: run.id,
        durationMs: run.durationMs,
      });

      this.eventEmitter.emit(JOB_RUN_EVENTS.completed, {
        jobId,
        runId: run.id,
      });
    } catch (error) {
      if (error instanceof ClaudeStreamExecutionError) {
        run.streamEvents = error.partialResult.streamEvents;
      }

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Job run failed', {
        jobId,
        runId: run.id,
        error: message,
      });

      run.markFailed(message);
      let failurePersisted = true;
      await this.scheduledJobRunRepository.save(run).catch((saveErr) => {
        failurePersisted = false;
        this.logger.error('Failed to persist run failure', {
          runId: run.id,
          error: saveErr instanceof Error ? saveErr.message : String(saveErr),
        });
      });
      if (failurePersisted) {
        this.eventEmitter.emit(JOB_RUN_EVENTS.updated, {
          jobId,
          runId: run.id,
        });
      }

      this.eventEmitter.emit(JOB_RUN_EVENTS.failed, {
        jobId,
        runId: run.id,
        error: message,
      });
    } finally {
      if (run.containerId) {
        await this.dockerEngine.stopContainer(run.containerId).catch((err) =>
          this.logger.warn('Failed to stop ephemeral container', {
            containerId: run.containerId,
            error: err instanceof Error ? err.message : String(err),
          }),
        );

        await this.dockerEngine.removeContainer(run.containerId).catch((err) =>
          this.logger.warn('Failed to remove ephemeral container', {
            containerId: run.containerId,
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
      if (ports) {
        await this.portManager.releasePortPair(ports);
      }
    }
  }

  private async createContainerWithRetries(
    options: EphemeralContainerCreateOptions,
    run: ScheduledJobRun,
  ): Promise<{ id: string }> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_CONTAINER_START_RETRIES; attempt++) {
      try {
        const container =
          await this.dockerEngine.createEphemeralContainer(options);

        this.logger.log('Waiting for container to be ready', {
          jobId: options.jobId,
          runId: run.id,
          containerId: container.id,
          attempt,
        });
        await this.dockerEngine.waitForContainerReady(container.id);
        this.logger.log('Container is ready', {
          jobId: options.jobId,
          runId: run.id,
          attempt,
        });

        return container;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.logger.warn('Container start attempt failed', {
          jobId: options.jobId,
          runId: run.id,
          attempt,
          maxAttempts: MAX_CONTAINER_START_RETRIES,
          error: lastError.message,
        });

        if (run.containerId) {
          await this.dockerEngine
            .removeContainer(run.containerId)
            .catch(() => {});
          run.containerId = undefined as unknown as string;
        }

        if (attempt < MAX_CONTAINER_START_RETRIES) {
          const delayMs = CONTAINER_RETRY_BASE_DELAY_MS * attempt;
          this.logger.log('Retrying container creation', {
            jobId: options.jobId,
            runId: run.id,
            nextAttemptIn: `${delayMs}ms`,
          });
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          await this.dockerEngine.waitForDockerReady();
        }
      }
    }

    throw lastError ?? new Error('Container creation failed after retries');
  }

  private async runClaudePrompt(
    containerId: string,
    runId: string,
    jobId: string,
    prompt: string,
    model?: string | null,
  ): Promise<{ streamEvents: any[] }> {
    const execution = await this.claudeStreamRunner.startPrompt({
      containerId,
      prompt,
      model: model ?? undefined,
      workingDir: WORKSPACE_DIR,
      includePartialMessages: true,
      onEvent: (event) => {
        this.eventEmitter.emit(JOB_RUN_EVENTS.stream, {
          jobId,
          runId,
          event: event as unknown,
        });
      },
      onPersistSnapshot: async (streamEvents) => {
        const run = await this.scheduledJobRunRepository.findById(runId);
        if (!run) {
          return;
        }

        run.streamEvents = streamEvents;
        await this.scheduledJobRunRepository.save(run);
      },
    });

    const result = await execution.result;
    return { streamEvents: result.streamEvents };
  }

  private generateBranchName(prefix: string): string {
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
    return `${prefix}-${timestamp}`;
  }
}
