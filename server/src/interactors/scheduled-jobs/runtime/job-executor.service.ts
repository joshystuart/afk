import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRunRepository } from '../../../domain/scheduled-jobs/scheduled-job-run.repository';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { PortManagerService } from '../../../libs/docker/port-manager.service';
import { ClaudeStreamExecutionError } from '../../../libs/claude/claude-stream-runner.service';
import { PortPairDto } from '../../../domain/containers/port-pair.dto';
import { ScheduledJobClaudeGitService } from './scheduled-job-claude-git.service';
import { ScheduledJobRunEventsService } from './scheduled-job-run-events.service';
import { ScheduledJobRuntimeService } from './scheduled-job-runtime.service';
import { ScheduledJobRunStateService } from './scheduled-job-run-state.service';

@Injectable()
export class JobExecutorService {
  private readonly logger = new Logger(JobExecutorService.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
    private readonly dockerEngine: DockerEngineService,
    private readonly portManager: PortManagerService,
    private readonly scheduledJobClaudeGit: ScheduledJobClaudeGitService,
    private readonly scheduledJobRunEvents: ScheduledJobRunEventsService,
    private readonly scheduledJobRuntime: ScheduledJobRuntimeService,
    private readonly scheduledJobRunState: ScheduledJobRunStateService,
  ) {}

  async execute(
    jobId: string,
    options: { ignoreEnabled?: boolean; scheduledTrigger?: boolean } = {},
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

    const activeRun =
      await this.scheduledJobRunRepository.findActiveByJobId(jobId);
    if (activeRun) {
      this.logger.log('Dedup: active run found, skipping', {
        jobId,
        activeRunId: activeRun.id,
      });
      return;
    }

    const run = await this.scheduledJobRunState.createPendingRun(job);
    this.scheduledJobRunEvents.publishStarted(jobId, run.id);

    let ports: PortPairDto | null = null;

    try {
      await this.scheduledJobRunState.markRunning(job, run, options);
      this.scheduledJobRunEvents.publishUpdated(jobId, run.id);

      const runtime = await this.scheduledJobRuntime.prepare(job, run);
      ports = runtime.ports;

      this.scheduledJobRunState.setBranch(run, runtime.branchName);
      await this.scheduledJobRunState.attachContainer(run, runtime.containerId);
      this.scheduledJobRunEvents.publishUpdated(jobId, run.id);

      const execution = await this.scheduledJobClaudeGit.execute(
        job,
        run,
        runtime.containerId,
        runtime.branchName,
      );
      this.scheduledJobRunState.applyStreamResult(run, execution.streamResult);

      if (execution.commitResult) {
        this.scheduledJobRunState.applyCommitResult(
          run,
          execution.commitResult,
        );
      }

      await this.scheduledJobRunState.markCompleted(run);
      this.scheduledJobRunEvents.publishUpdated(jobId, run.id);

      this.logger.log('Job run completed successfully', {
        jobId,
        runId: run.id,
        durationMs: run.durationMs,
      });

      this.scheduledJobRunEvents.publishCompleted(jobId, run.id);
    } catch (error) {
      if (error instanceof ClaudeStreamExecutionError) {
        this.scheduledJobRunState.applyStreamResult(run, error.partialResult);
      }

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Job run failed', {
        jobId,
        runId: run.id,
        error: message,
      });

      const failurePersisted = await this.scheduledJobRunState.markFailed(
        run,
        message,
      );
      if (failurePersisted) {
        this.scheduledJobRunEvents.publishUpdated(jobId, run.id);
      }

      this.scheduledJobRunEvents.publishFailed(jobId, run.id, message);
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
}
