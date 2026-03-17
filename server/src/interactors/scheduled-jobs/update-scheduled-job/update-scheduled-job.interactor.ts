import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
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
  ) {}

  async execute(
    id: string,
    request: UpdateScheduledJobRequest,
  ): Promise<ScheduledJob> {
    const job = await this.scheduledJobRepository.findById(id);
    if (!job) {
      throw new Error('Scheduled job not found');
    }

    if (request.name !== undefined) {
      const trimmed = request.name.trim();
      if (!trimmed) {
        throw new Error('Job name cannot be empty');
      }
      job.name = trimmed;
    }

    if (request.repoUrl !== undefined) job.repoUrl = request.repoUrl;
    if (request.branch !== undefined) job.branch = request.branch;
    if (request.createNewBranch !== undefined)
      job.createNewBranch = request.createNewBranch;
    if (request.newBranchPrefix !== undefined)
      job.newBranchPrefix = request.newBranchPrefix || null;
    if (request.imageId !== undefined) job.imageId = request.imageId;
    if (request.prompt !== undefined) job.prompt = request.prompt;
    if (request.scheduleType !== undefined)
      job.scheduleType = request.scheduleType;
    if (request.cronExpression !== undefined)
      job.cronExpression = request.cronExpression || null;
    if (request.intervalMs !== undefined)
      job.intervalMs = request.intervalMs || null;
    if (request.commitAndPush !== undefined)
      job.commitAndPush = request.commitAndPush;
    if (request.enabled !== undefined) job.enabled = request.enabled;

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
