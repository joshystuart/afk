import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledJobRunStreamChunk } from './scheduled-job-run-stream-chunk.entity';

@Injectable()
export class ScheduledJobRunStreamChunkRepository {
  constructor(
    @InjectRepository(ScheduledJobRunStreamChunk)
    private readonly repository: Repository<ScheduledJobRunStreamChunk>,
  ) {}

  async save(chunk: ScheduledJobRunStreamChunk): Promise<void> {
    await this.repository.save(chunk);
  }

  async getMaxSequence(runId: string): Promise<number> {
    const row = await this.repository
      .createQueryBuilder('c')
      .select('MAX(c.sequence)', 'max')
      .where('c.runId = :runId', { runId })
      .getRawOne<{ max: number | null }>();
    return row?.max ?? 0;
  }

  async findByRunIdOrdered(
    runId: string,
  ): Promise<ScheduledJobRunStreamChunk[]> {
    return this.repository.find({
      where: { run: { id: runId } },
      order: { sequence: 'ASC' },
    });
  }
}
