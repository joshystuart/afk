import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
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

  async findByJobIdSummaries(jobId: string): Promise<ScheduledJobRun[]> {
    return await this.repository.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'jobId',
        'status',
        'branch',
        'containerId',
        'streamEventCount',
        'streamByteCount',
        'errorMessage',
        'committed',
        'filesChanged',
        'commitSha',
        'durationMs',
        'startedAt',
        'completedAt',
        'createdAt',
      ],
    });
  }

  async findActiveByJobId(jobId: string): Promise<ScheduledJobRun | null> {
    return await this.repository.findOne({
      where: [
        { jobId, status: ScheduledJobRunStatus.PENDING },
        { jobId, status: ScheduledJobRunStatus.RUNNING },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByJobIds(
    jobIds: string[],
  ): Promise<Map<string, ScheduledJobRun>> {
    if (jobIds.length === 0) {
      return new Map();
    }

    const activeRuns = await this.repository.find({
      where: [
        { jobId: In(jobIds), status: ScheduledJobRunStatus.PENDING },
        { jobId: In(jobIds), status: ScheduledJobRunStatus.RUNNING },
      ],
      order: { createdAt: 'DESC' },
    });

    const runsByJobId = new Map<string, ScheduledJobRun>();

    for (const run of activeRuns) {
      if (!runsByJobId.has(run.jobId)) {
        runsByJobId.set(run.jobId, run);
      }
    }

    return runsByJobId;
  }

  async deleteByJobId(jobId: string): Promise<void> {
    await this.repository.delete({ jobId });
  }
}
