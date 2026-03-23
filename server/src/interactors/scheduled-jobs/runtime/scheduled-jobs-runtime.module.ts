import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DockerImagesModule } from '../../../domain/docker-images/docker-images.module';
import { ScheduledJobsDomainModule } from '../../../domain/scheduled-jobs/scheduled-jobs.module';
import { ChatModule } from '../../sessions/chat/chat.module';
import { DockerModule } from '../../../libs/docker/docker.module';
import { GitModule } from '../../../libs/git/git.module';
import { SettingsPersistenceModule } from '../../../libs/settings/settings-persistence.module';
import { StreamArchiveModule } from '../../../libs/stream-archive/stream-archive.module';
import { JobExecutorService } from './job-executor.service';
import { JobSchedulerService } from './job-scheduler.service';
import { LaunchdService } from './launchd.service';
import { ScheduledJobClaudeGitService } from './scheduled-job-claude-git.service';
import { ScheduledJobRunEventsService } from './scheduled-job-run-events.service';
import { ScheduledJobRunStateService } from './scheduled-job-run-state.service';
import { ScheduledJobRuntimeService } from './scheduled-job-runtime.service';
import { ScheduledJobTimingService } from './scheduled-job-timing.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ScheduledJobsDomainModule,
    DockerModule,
    DockerImagesModule,
    SettingsPersistenceModule,
    ChatModule,
    GitModule,
    StreamArchiveModule,
  ],
  providers: [
    ScheduledJobClaudeGitService,
    JobExecutorService,
    ScheduledJobRunEventsService,
    ScheduledJobRuntimeService,
    ScheduledJobRunStateService,
    JobSchedulerService,
    LaunchdService,
    ScheduledJobTimingService,
  ],
  exports: [
    ScheduledJobClaudeGitService,
    JobExecutorService,
    ScheduledJobRunEventsService,
    ScheduledJobRuntimeService,
    ScheduledJobRunStateService,
    JobSchedulerService,
    LaunchdService,
    ScheduledJobTimingService,
  ],
})
export class ScheduledJobsRuntimeModule {}
