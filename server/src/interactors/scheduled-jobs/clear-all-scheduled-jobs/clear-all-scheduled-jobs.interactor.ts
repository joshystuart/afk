import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { DeleteScheduledJobInteractor } from '../delete-scheduled-job/delete-scheduled-job.interactor';

export interface ClearAllScheduledJobsResult {
  deleted: number;
  failed: number;
}

@Injectable()
export class ClearAllScheduledJobsInteractor {
  private readonly logger = new Logger(ClearAllScheduledJobsInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly deleteScheduledJobInteractor: DeleteScheduledJobInteractor,
  ) {}

  async execute(): Promise<ClearAllScheduledJobsResult> {
    const jobs = await this.scheduledJobRepository.findAll();
    let deleted = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await this.deleteScheduledJobInteractor.execute(job.id);
        deleted++;
      } catch (error) {
        this.logger.error(`Failed to delete scheduled job ${job.id}`, error);
        failed++;
      }
    }

    this.logger.log(
      `Clear all scheduled jobs complete: deleted=${deleted}, failed=${failed}`,
    );
    return { deleted, failed };
  }
}
