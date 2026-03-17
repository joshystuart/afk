import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { DockerImageRepository } from '../../../domain/docker-images/docker-image.repository';
import { CreateScheduledJobRequest } from './create-scheduled-job-request.dto';

@Injectable()
export class CreateScheduledJobInteractor {
  private readonly logger = new Logger(CreateScheduledJobInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly dockerImageRepository: DockerImageRepository,
  ) {}

  async execute(request: CreateScheduledJobRequest): Promise<ScheduledJob> {
    const image = await this.dockerImageRepository.findById(request.imageId);
    if (!image) {
      throw new Error(`Docker image not found: ${request.imageId}`);
    }

    const job = new ScheduledJob();
    job.id = uuid();
    job.name = request.name.trim();
    job.repoUrl = request.repoUrl;
    job.branch = request.branch;
    job.createNewBranch = request.createNewBranch ?? false;
    job.newBranchPrefix = request.newBranchPrefix ?? null;
    job.imageId = request.imageId;
    job.prompt = request.prompt;
    job.scheduleType = request.scheduleType;
    job.cronExpression = request.cronExpression ?? null;
    job.intervalMs = request.intervalMs ?? null;
    job.commitAndPush = request.commitAndPush ?? false;
    job.enabled = true;
    job.lastRunAt = null;
    job.nextRunAt = null;

    await this.scheduledJobRepository.save(job);

    this.logger.log(`Created scheduled job: ${job.id} (${job.name})`);

    return job;
  }
}
