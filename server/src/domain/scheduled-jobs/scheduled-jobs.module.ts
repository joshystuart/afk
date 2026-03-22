import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledJob } from './scheduled-job.entity';
import { ScheduledJobRun } from './scheduled-job-run.entity';
import { ScheduledJobDefinitionService } from './scheduled-job-definition.service';
import { ScheduledJobRepository } from './scheduled-job.repository';
import { ScheduledJobRunRepository } from './scheduled-job-run.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledJob, ScheduledJobRun])],
  providers: [
    ScheduledJobRepository,
    ScheduledJobRunRepository,
    ScheduledJobDefinitionService,
  ],
  exports: [
    ScheduledJobRepository,
    ScheduledJobRunRepository,
    ScheduledJobDefinitionService,
  ],
})
export class ScheduledJobsDomainModule {}
