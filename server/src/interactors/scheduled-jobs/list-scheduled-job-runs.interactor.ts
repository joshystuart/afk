import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJobRun } from '../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunRepository } from '../../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRepository } from '../../domain/scheduled-jobs/scheduled-job.repository';
import { ClaudeEventArchiveService } from '../../services/stream-archive/claude-event-archive.service';

@Injectable()
export class ListScheduledJobRunsInteractor {
  private readonly logger = new Logger(ListScheduledJobRunsInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
    private readonly claudeEventArchive: ClaudeEventArchiveService,
  ) {}

  async execute(jobId: string): Promise<ScheduledJobRun[]> {
    const job = await this.scheduledJobRepository.findById(jobId);
    if (!job) {
      throw new Error('Scheduled job not found');
    }

    const runs = await this.scheduledJobRunRepository.findByJobId(jobId);
    this.logger.log(`Found ${runs.length} runs for job ${jobId}`);
    return Promise.all(runs.map((r) => this.hydrateRunStreamEvents(r)));
  }

  private async hydrateRunStreamEvents(
    run: ScheduledJobRun,
  ): Promise<ScheduledJobRun> {
    if (run.streamEvents && run.streamEvents.length > 0) {
      return run;
    }
    if (!run.streamEventCount || run.streamEventCount <= 0) {
      return run;
    }
    run.streamEvents = await this.claudeEventArchive.loadEventsForJobRun(
      run.id,
    );
    return run;
  }
}
