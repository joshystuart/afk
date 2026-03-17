import { Injectable, Logger } from '@nestjs/common';
import { ScheduledJobRepository } from '../../domain/scheduled-jobs/scheduled-job.repository';

@Injectable()
export class DeleteScheduledJobInteractor {
  private readonly logger = new Logger(DeleteScheduledJobInteractor.name);

  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const job = await this.scheduledJobRepository.findById(id);
    if (!job) {
      throw new Error('Scheduled job not found');
    }

    await this.scheduledJobRepository.delete(id);

    this.logger.log(`Deleted scheduled job: ${id} (${job.name})`);
  }
}
