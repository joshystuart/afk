import { Injectable } from '@nestjs/common';
import { ScheduledJob } from '../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRunRepository } from '../../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobResponseDto } from './scheduled-job-response.dto';

@Injectable()
export class ScheduledJobResponseFactory {
  constructor(
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
  ) {}

  async create(job: ScheduledJob): Promise<ScheduledJobResponseDto> {
    const currentRun = await this.scheduledJobRunRepository.findActiveByJobId(
      job.id,
    );

    return ScheduledJobResponseDto.fromDomain(job, currentRun);
  }

  async createMany(jobs: ScheduledJob[]): Promise<ScheduledJobResponseDto[]> {
    const currentRunsByJobId =
      await this.scheduledJobRunRepository.findActiveByJobIds(
        jobs.map((job) => job.id),
      );

    return jobs.map((job) =>
      ScheduledJobResponseDto.fromDomain(job, currentRunsByJobId.get(job.id)),
    );
  }
}
