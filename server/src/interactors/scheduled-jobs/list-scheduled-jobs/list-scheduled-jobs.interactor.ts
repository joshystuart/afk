import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';

@Injectable()
export class ListScheduledJobsInteractor {
  private readonly logger = new Logger(ListScheduledJobsInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
  ) {}

  async execute(): Promise<ScheduledJob[]> {
    const jobs = await this.scheduledJobRepository.findAll();
    this.logger.log(`Found ${jobs.length} scheduled jobs`);
    return jobs;
  }
}
