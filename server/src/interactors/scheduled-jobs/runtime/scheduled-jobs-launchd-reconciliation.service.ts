import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { LaunchdService } from './launchd.service';

@Injectable()
export class ScheduledJobsLaunchdReconciliationService
  implements OnApplicationBootstrap
{
  private readonly logger = new Logger(
    ScheduledJobsLaunchdReconciliationService.name,
  );

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly launchdService: LaunchdService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const jobs = await this.scheduledJobRepository.findAll();
      const result = await this.launchdService.reconcilePlists(jobs);

      this.logger.log('Scheduled job launchd reconciliation complete', {
        totalJobs: jobs.length,
        removedOrphaned: result.removedOrphaned,
        removedDisabled: result.removedDisabled,
        recreatedEnabled: result.recreatedEnabled,
      });
    } catch (error) {
      this.logger.error('Scheduled job launchd reconciliation failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
