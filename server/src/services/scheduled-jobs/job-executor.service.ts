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
import { NdjsonParser } from '../chat/ndjson-parser';
import { PortPairDto } from '../../domain/containers/port-pair.dto';

const DEDUP_WINDOW_MS = 60_000;
const CONTAINER_READY_MAX_ATTEMPTS = 30;
const WORKSPACE_DIR = '/workspace/repo';

export const JOB_RUN_EVENTS = {
  started: 'job.run.started',
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
  ) {}

  async execute(jobId: string): Promise<void> {
    const job = await this.scheduledJobRepository.findById(jobId);
    if (!job) {
      this.logger.warn('Job not found, skipping execution', { jobId });
      return;
    }
    if (!job.enabled) {
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
    await this.scheduledJobRunRepository.save(run);

    this.eventEmitter.emit(JOB_RUN_EVENTS.started, {
      jobId,
      runId: run.id,
    });

    let ports: PortPairDto | null = null;

    try {
      run.markRunning();
      await this.scheduledJobRunRepository.save(run);

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

      const container = await this.dockerEngine.createEphemeralContainer({
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
      });

      run.containerId = container.id;
      await this.scheduledJobRunRepository.save(run);

      await this.waitForContainerReady(container.id);

      if (job.createNewBranch) {
        await this.dockerEngine.execInContainer(
          container.id,
          ['git', 'checkout', '-b', branchName],
          WORKSPACE_DIR,
        );
      }

      const streamEvents = await this.runClaudePrompt(container.id, job.prompt);
      run.streamEvents = streamEvents;

      if (job.commitAndPush) {
        const commitResult = await this.commitAndPush(container.id, branchName);
        run.committed = commitResult.committed;
        run.filesChanged = commitResult.filesChanged;
        run.commitSha = commitResult.commitSha;
      }

      run.markCompleted();
      await this.scheduledJobRunRepository.save(run);

      job.recordRun(new Date());
      await this.scheduledJobRepository.save(job);

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
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Job run failed', {
        jobId,
        runId: run.id,
        error: message,
      });

      run.markFailed(message);
      await this.scheduledJobRunRepository.save(run).catch((saveErr) => {
        this.logger.error('Failed to persist run failure', {
          runId: run.id,
          error: saveErr instanceof Error ? saveErr.message : String(saveErr),
        });
      });

      this.eventEmitter.emit(JOB_RUN_EVENTS.failed, {
        jobId,
        runId: run.id,
        error: message,
      });
    } finally {
      if (run.containerId) {
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

  private async runClaudePrompt(
    containerId: string,
    prompt: string,
  ): Promise<any[]> {
    const parser = new NdjsonParser();
    const streamEvents: any[] = [];
    let completed = false;
    let resolvePromise: (events: any[]) => void;
    let rejectPromise: (err: Error) => void;

    const resultPromise = new Promise<any[]>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    const cmd = [
      'claude',
      '-p',
      prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
    ];

    const { stream, kill } = await this.dockerEngine.execStreamInContainer(
      containerId,
      cmd,
      (chunk: string) => {
        const events = parser.parse(chunk);
        for (const event of events) {
          streamEvents.push(event);
          if (event.type === 'result' && !completed) {
            completed = true;
            kill().catch(() => {});
            resolvePromise(streamEvents);
          }
        }
      },
      WORKSPACE_DIR,
    );

    stream.on('end', () => {
      const remaining = parser.flush();
      for (const event of remaining) {
        streamEvents.push(event);
      }
      if (!completed) {
        completed = true;
        resolvePromise(streamEvents);
      }
    });

    stream.on('error', (err: Error) => {
      if (!completed) {
        completed = true;
        rejectPromise(err);
      }
    });

    return resultPromise;
  }

  private async commitAndPush(
    containerId: string,
    branchName: string,
  ): Promise<{
    committed: boolean;
    filesChanged: number;
    commitSha: string | null;
  }> {
    const diffResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'diff', '--stat', '--cached'],
      WORKSPACE_DIR,
    );

    await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'add', '-A'],
      WORKSPACE_DIR,
    );

    const statusResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'status', '--porcelain'],
      WORKSPACE_DIR,
    );

    if (!statusResult.stdout.trim()) {
      this.logger.log('No changes to commit');
      return { committed: false, filesChanged: 0, commitSha: null };
    }

    const filesChanged = statusResult.stdout
      .trim()
      .split('\n')
      .filter((line) => line.trim()).length;

    const commitResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'commit', '-m', `AFK scheduled job: automated changes`],
      WORKSPACE_DIR,
    );

    if (commitResult.exitCode !== 0) {
      this.logger.warn('Git commit failed', { stderr: commitResult.stderr });
      return { committed: false, filesChanged, commitSha: null };
    }

    const shaResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'rev-parse', 'HEAD'],
      WORKSPACE_DIR,
    );
    const commitSha = shaResult.stdout.trim() || null;

    const pushResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'push', 'origin', branchName],
      WORKSPACE_DIR,
    );

    if (pushResult.exitCode !== 0) {
      this.logger.warn('Git push failed', { stderr: pushResult.stderr });
      return { committed: true, filesChanged, commitSha };
    }

    return { committed: true, filesChanged, commitSha };
  }

  private async waitForContainerReady(containerId: string): Promise<void> {
    for (let i = 0; i < CONTAINER_READY_MAX_ATTEMPTS; i++) {
      const info = await this.dockerEngine.getContainerInfo(containerId);
      if (info.state === 'running') {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error('Ephemeral container failed to start within timeout');
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
