import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { JobExecutorService } from '../../../services/scheduled-jobs/job-executor.service';

@Injectable()
export class TriggerScheduledJobInteractor {
  private readonly logger = new Logger(TriggerScheduledJobInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly jobExecutor: JobExecutorService,
  ) {}

  async execute(jobId: string): Promise<void> {
    const job = await this.scheduledJobRepository.findById(jobId);
    if (!job) {
      throw new Error('Scheduled job not found');
    }

    this.logger.log('Triggering manual job execution', {
      jobId,
      jobName: job.name,
    });

    // Fire and forget — execution runs in the background
    this.jobExecutor.execute(jobId).catch((err) => {
      this.logger.error('Background job execution failed', {
        jobId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
}
