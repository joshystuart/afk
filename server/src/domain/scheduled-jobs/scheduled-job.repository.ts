import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledJob } from './scheduled-job.entity';

@Injectable()
export class ScheduledJobRepository {
  constructor(
    @InjectRepository(ScheduledJob)
    private readonly repository: Repository<ScheduledJob>,
  ) {}

  async save(job: ScheduledJob): Promise<void> {
    await this.repository.save(job);
  }

  async findById(id: string): Promise<ScheduledJob | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<ScheduledJob[]> {
    return await this.repository.find({ order: { createdAt: 'DESC' } });
  }

  async findEnabled(): Promise<ScheduledJob[]> {
    return await this.repository.find({
      where: { enabled: true },
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.repository.count({ where: { id } });
    return count > 0;
  }
}
