import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ScheduledJob } from '../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRepository } from '../../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRun } from '../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunRepository } from '../../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRunStatus } from '../../domain/scheduled-jobs/scheduled-job-run-status.enum';
import { ScheduledJobTimingService } from './scheduled-job-timing.service';
import { ClaudeStreamRunnerResult } from '../chat/claude-stream-runner.service';
import { GitCommitAndPushResult } from '../git/git.service';

@Injectable()
export class ScheduledJobRunStateService {
  private readonly logger = new Logger(ScheduledJobRunStateService.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
    private readonly scheduledJobTimingService: ScheduledJobTimingService,
  ) {}

  async createPendingRun(job: ScheduledJob): Promise<ScheduledJobRun> {
    const run = new ScheduledJobRun();
    run.id = uuidv4();
    run.jobId = job.id;
    run.status = ScheduledJobRunStatus.PENDING;
    run.branch = job.branch;
    run.committed = false;
    run.streamEvents = null;
    run.streamEventCount = null;
    run.streamByteCount = null;
    await this.scheduledJobRunRepository.save(run);
    return run;
  }

  async markRunning(
    job: ScheduledJob,
    run: ScheduledJobRun,
    options: { scheduledTrigger?: boolean },
  ): Promise<void> {
    run.markRunning();
    await this.scheduledJobRunRepository.save(run);

    job.recordRun(run.startedAt ?? new Date());
    if (options.scheduledTrigger) {
      job.nextRunAt = this.scheduledJobTimingService.calculateNextRunAt(job, {
        fromDate: run.startedAt ?? new Date(),
      });
    }
    await this.scheduledJobRepository.save(job);
  }

  setBranch(run: ScheduledJobRun, branchName: string): void {
    run.branch = branchName;
  }

  async attachContainer(
    run: ScheduledJobRun,
    containerId: string,
  ): Promise<void> {
    run.containerId = containerId;
    await this.scheduledJobRunRepository.save(run);
  }

  applyStreamResult(
    run: ScheduledJobRun,
    streamResult: Pick<
      ClaudeStreamRunnerResult,
      'streamEventCount' | 'streamByteCount'
    >,
  ): void {
    run.streamEventCount = streamResult.streamEventCount;
    run.streamByteCount = streamResult.streamByteCount;
    run.streamEvents = null;
  }

  applyCommitResult(
    run: ScheduledJobRun,
    commitResult: Pick<
      GitCommitAndPushResult,
      'committed' | 'filesChanged' | 'commitSha'
    >,
  ): void {
    run.committed = commitResult.committed;
    run.filesChanged = commitResult.filesChanged;
    run.commitSha = commitResult.commitSha;
  }

  async markCompleted(run: ScheduledJobRun): Promise<void> {
    run.markCompleted();
    await this.scheduledJobRunRepository.save(run);
  }

  async markFailed(
    run: ScheduledJobRun,
    errorMessage: string,
  ): Promise<boolean> {
    run.markFailed(errorMessage);

    let failurePersisted = true;
    await this.scheduledJobRunRepository.save(run).catch((saveErr) => {
      failurePersisted = false;
      this.logger.error('Failed to persist run failure', {
        runId: run.id,
        error: saveErr instanceof Error ? saveErr.message : String(saveErr),
      });
    });

    return failurePersisted;
  }
}
