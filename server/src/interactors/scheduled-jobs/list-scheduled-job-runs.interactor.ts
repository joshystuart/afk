import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJobRun } from '../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunRepository } from '../../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRepository } from '../../domain/scheduled-jobs/scheduled-job.repository';

@Injectable()
export class ListScheduledJobRunsInteractor {
  private readonly logger = new Logger(ListScheduledJobRunsInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
  ) {}

  async execute(jobId: string): Promise<ScheduledJobRun[]> {
    const job = await this.scheduledJobRepository.findById(jobId);
    if (!job) {
      throw new Error('Scheduled job not found');
    }

    const runs =
      await this.scheduledJobRunRepository.findByJobIdSummaries(jobId);
    this.logger.log(`Found ${runs.length} runs for job ${jobId}`);
    return runs;
  }
}
