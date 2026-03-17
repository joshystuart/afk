import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJobRepository } from '../../domain/scheduled-jobs/scheduled-job.repository';
import { JobSchedulerService } from '../../services/scheduled-jobs/job-scheduler.service';
import { LaunchdService } from '../../services/scheduled-jobs/launchd.service';

@Injectable()
export class DeleteScheduledJobInteractor {
  private readonly logger = new Logger(DeleteScheduledJobInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly jobScheduler: JobSchedulerService,
    private readonly launchdService: LaunchdService,
  ) {}

  async execute(id: string): Promise<void> {
    const job = await this.scheduledJobRepository.findById(id);
    if (!job) {
      throw new Error('Scheduled job not found');
    }

    this.jobScheduler.unregisterJob(id);
    await this.launchdService.removePlist(id);

    await this.scheduledJobRepository.delete(id);

    this.logger.log(`Deleted scheduled job: ${id} (${job.name})`);
  }
}
