import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobDefinitionService } from '../../../domain/scheduled-jobs/scheduled-job-definition.service';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { JobSchedulerService } from '../../../services/scheduled-jobs/job-scheduler.service';
import { LaunchdService } from '../../../services/scheduled-jobs/launchd.service';
import { UpdateScheduledJobRequest } from './update-scheduled-job-request.dto';

@Injectable()
export class UpdateScheduledJobInteractor {
  private readonly logger = new Logger(UpdateScheduledJobInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly jobScheduler: JobSchedulerService,
    private readonly launchdService: LaunchdService,
    private readonly scheduledJobDefinitionService: ScheduledJobDefinitionService,
  ) {}

  async execute(
    id: string,
    request: UpdateScheduledJobRequest,
  ): Promise<ScheduledJob> {
    const job = await this.scheduledJobRepository.findById(id);
    if (!job) {
      throw new Error('Scheduled job not found');
    }

    this.scheduledJobDefinitionService.apply(job, request);

    await this.scheduledJobRepository.save(job);

    await this.jobScheduler.updateJob(job);
    await this.launchdService.updatePlist(job);

    this.logger.log(`Updated scheduled job: ${job.id} (${job.name})`);

    const updated = await this.scheduledJobRepository.findById(id);
    if (!updated) {
      throw new Error('Scheduled job not found');
    }
    return updated;
  }
}
