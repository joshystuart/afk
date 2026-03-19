import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledJobsDomainModule } from '../../domain/scheduled-jobs/scheduled-jobs.module';
import { DockerModule } from '../docker/docker.module';
import { DockerImagesModule } from '../../domain/docker-images/docker-images.module';
import { SettingsModule } from '../../interactors/settings/settings.module';
import { ChatModule } from '../chat/chat.module';
import { GitModule } from '../git/git.module';
import { StreamArchiveModule } from '../stream-archive/stream-archive.module';
import { JobExecutorService } from './job-executor.service';
import { JobSchedulerService } from './job-scheduler.service';
import { LaunchdService } from './launchd.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ScheduledJobsDomainModule,
    DockerModule,
    DockerImagesModule,
    SettingsModule,
    ChatModule,
    GitModule,
    StreamArchiveModule,
  ],
  providers: [JobExecutorService, JobSchedulerService, LaunchdService],
  exports: [JobExecutorService, JobSchedulerService, LaunchdService],
})
export class ScheduledJobsServicesModule {}
