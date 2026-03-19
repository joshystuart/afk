import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledJob } from './scheduled-job.entity';
import { ScheduledJobRun } from './scheduled-job-run.entity';
import { ScheduledJobRepository } from './scheduled-job.repository';
import { ScheduledJobRunRepository } from './scheduled-job-run.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledJob, ScheduledJobRun])],
  providers: [ScheduledJobRepository, ScheduledJobRunRepository],
  exports: [ScheduledJobRepository, ScheduledJobRunRepository],
})
export class ScheduledJobsDomainModule {}
