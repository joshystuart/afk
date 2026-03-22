import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobDefinitionService } from '../../../domain/scheduled-jobs/scheduled-job-definition.service';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { DockerImageRepository } from '../../../domain/docker-images/docker-image.repository';
import { JobSchedulerService } from '../../../services/scheduled-jobs/job-scheduler.service';
import { LaunchdService } from '../../../services/scheduled-jobs/launchd.service';
import { CreateScheduledJobRequest } from './create-scheduled-job-request.dto';

@Injectable()
export class CreateScheduledJobInteractor {
  private readonly logger = new Logger(CreateScheduledJobInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly dockerImageRepository: DockerImageRepository,
    private readonly jobScheduler: JobSchedulerService,
    private readonly launchdService: LaunchdService,
    private readonly scheduledJobDefinitionService: ScheduledJobDefinitionService,
  ) {}

  async execute(request: CreateScheduledJobRequest): Promise<ScheduledJob> {
    const image = await this.dockerImageRepository.findById(request.imageId);
    if (!image) {
      throw new Error(`Docker image not found: ${request.imageId}`);
    }

    const job = this.scheduledJobDefinitionService.create(uuid(), {
      name: request.name,
      repoUrl: request.repoUrl,
      branch: request.branch,
      createNewBranch: request.createNewBranch ?? false,
      newBranchPrefix: request.newBranchPrefix ?? null,
      imageId: request.imageId,
      prompt: request.prompt,
      model: request.model,
      scheduleType: request.scheduleType,
      cronExpression: request.cronExpression ?? null,
      intervalMs: request.intervalMs ?? null,
      commitAndPush: request.commitAndPush ?? false,
      enabled: true,
    });

    await this.scheduledJobRepository.save(job);

    await this.jobScheduler.registerJob(job);
    await this.launchdService.createPlist(job);

    this.logger.log(`Created scheduled job: ${job.id} (${job.name})`);

    return job;
  }
}
