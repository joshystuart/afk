import { Injectable } from '@nestjs/common';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';

@Injectable()
export class GetScheduledJobInteractor {
  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
  ) {}

  async execute(id: string): Promise<ScheduledJob> {
    const job = await this.scheduledJobRepository.findById(id);
    if (!job) {
      throw new Error('Scheduled job not found');
    }
    return job;
  }
}
