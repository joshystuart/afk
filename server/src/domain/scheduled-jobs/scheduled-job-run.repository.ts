import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ScheduledJobRun } from './scheduled-job-run.entity';
import { ScheduledJobRunStatus } from './scheduled-job-run-status.enum';

@Injectable()
export class ScheduledJobRunRepository {
  constructor(
    @InjectRepository(ScheduledJobRun)
    private readonly repository: Repository<ScheduledJobRun>,
  ) {}

  async save(run: ScheduledJobRun): Promise<void> {
    await this.repository.save(run);
  }

  async findById(id: string): Promise<ScheduledJobRun | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByJobId(jobId: string): Promise<ScheduledJobRun[]> {
    return await this.repository.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
    });
  }

  async findRecentByJobId(
    jobId: string,
    withinMs: number,
  ): Promise<ScheduledJobRun[]> {
    const cutoff = new Date(Date.now() - withinMs);
    return await this.repository.find({
      where: {
        jobId,
        createdAt: MoreThan(cutoff),
        status: ScheduledJobRunStatus.RUNNING,
      },
    });
  }

  async deleteByJobId(jobId: string): Promise<void> {
    await this.repository.delete({ jobId });
  }
}
