import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { JobSchedulerService } from '../runtime/job-scheduler.service';
import { LaunchdService } from '../runtime/launchd.service';

export interface PrepareScheduledJobsUninstallResult {
  disabledJobs: number;
  removedLaunchAgents: number;
}

@Injectable()
export class PrepareUninstallInteractor {
  private readonly logger = new Logger(PrepareUninstallInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly jobScheduler: JobSchedulerService,
    private readonly launchdService: LaunchdService,
  ) {}

  async execute(): Promise<PrepareScheduledJobsUninstallResult> {
    const jobs = await this.scheduledJobRepository.findAll();
    let disabledJobs = 0;

    for (const job of jobs) {
      this.jobScheduler.unregisterJob(job.id);

      if (!job.enabled) {
        continue;
      }

      job.disable();
      job.nextRunAt = null;
      await this.scheduledJobRepository.save(job);
      disabledJobs++;
    }

    const removedLaunchAgents =
      await this.launchdService.removeAllManagedPlists();

    this.logger.log('Prepared desktop schedules for uninstall', {
      disabledJobs,
      removedLaunchAgents,
      totalJobs: jobs.length,
    });

    return {
      disabledJobs,
      removedLaunchAgents,
    };
  }
}
