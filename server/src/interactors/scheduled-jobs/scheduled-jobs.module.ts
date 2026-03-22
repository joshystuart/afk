import { Module } from '@nestjs/common';
import { ScheduledJobsDomainModule } from '../../domain/scheduled-jobs/scheduled-jobs.module';
import { DockerImagesModule } from '../../domain/docker-images/docker-images.module';
import { StreamArchiveModule } from '../../libs/stream-archive/stream-archive.module';
import { AuthModule } from '../../libs/auth/auth.module';
import { ResponseModule } from '../../libs/response/response.module';
import { CreateScheduledJobController } from './create-scheduled-job/create-scheduled-job.controller';
import { CreateScheduledJobInteractor } from './create-scheduled-job/create-scheduled-job.interactor';
import { ListScheduledJobsController } from './list-scheduled-jobs/list-scheduled-jobs.controller';
import { ListScheduledJobsInteractor } from './list-scheduled-jobs/list-scheduled-jobs.interactor';
import { GetScheduledJobController } from './get-scheduled-job.controller';
import { GetScheduledJobInteractor } from './get-scheduled-job.interactor';
import { UpdateScheduledJobController } from './update-scheduled-job/update-scheduled-job.controller';
import { UpdateScheduledJobInteractor } from './update-scheduled-job/update-scheduled-job.interactor';
import { ClearAllScheduledJobsController } from './clear-all-scheduled-jobs.controller';
import { ClearAllScheduledJobsInteractor } from './clear-all-scheduled-jobs.interactor';
import { DeleteScheduledJobController } from './delete-scheduled-job.controller';
import { DeleteScheduledJobInteractor } from './delete-scheduled-job.interactor';
import { ListScheduledJobRunsController } from './list-scheduled-job-runs.controller';
import { ListScheduledJobRunsInteractor } from './list-scheduled-job-runs.interactor';
import { GetScheduledJobRunStreamController } from './get-scheduled-job-run-stream.controller';
import { TriggerScheduledJobController } from './trigger-scheduled-job/trigger-scheduled-job.controller';
import { TriggerScheduledJobInteractor } from './trigger-scheduled-job/trigger-scheduled-job.interactor';
import { TriggerTokenGuard } from './trigger-scheduled-job/trigger-token.guard';
import { ScheduledJobResponseFactory } from './scheduled-job-response.factory';
import { ScheduledJobsRuntimeModule } from './runtime/scheduled-jobs-runtime.module';

@Module({
  imports: [
    ScheduledJobsDomainModule,
    DockerImagesModule,
    ScheduledJobsRuntimeModule,
    StreamArchiveModule,
    AuthModule,
    ResponseModule,
  ],
  controllers: [
    CreateScheduledJobController,
    ListScheduledJobsController,
    GetScheduledJobController,
    UpdateScheduledJobController,
    ClearAllScheduledJobsController,
    DeleteScheduledJobController,
    ListScheduledJobRunsController,
    GetScheduledJobRunStreamController,
    TriggerScheduledJobController,
  ],
  providers: [
    CreateScheduledJobInteractor,
    ListScheduledJobsInteractor,
    GetScheduledJobInteractor,
    UpdateScheduledJobInteractor,
    DeleteScheduledJobInteractor,
    ClearAllScheduledJobsInteractor,
    ListScheduledJobRunsInteractor,
    TriggerScheduledJobInteractor,
    ScheduledJobResponseFactory,
    TriggerTokenGuard,
  ],
  exports: [
    CreateScheduledJobInteractor,
    ListScheduledJobsInteractor,
    GetScheduledJobInteractor,
    UpdateScheduledJobInteractor,
    DeleteScheduledJobInteractor,
    ListScheduledJobRunsInteractor,
    TriggerScheduledJobInteractor,
    ScheduledJobResponseFactory,
  ],
})
export class ScheduledJobsInteractorModule {}
