import { Module } from '@nestjs/common';
import { ScheduledJobsDomainModule } from '../../domain/scheduled-jobs/scheduled-jobs.module';
import { DockerImagesModule } from '../../domain/docker-images/docker-images.module';
import { ScheduledJobsServicesModule } from '../../services/scheduled-jobs/scheduled-jobs-services.module';
import { ResponseService } from '../../libs/response/response.service';
import { CreateScheduledJobController } from './create-scheduled-job/create-scheduled-job.controller';
import { CreateScheduledJobInteractor } from './create-scheduled-job/create-scheduled-job.interactor';
import { ListScheduledJobsController } from './list-scheduled-jobs/list-scheduled-jobs.controller';
import { ListScheduledJobsInteractor } from './list-scheduled-jobs/list-scheduled-jobs.interactor';
import { GetScheduledJobController } from './get-scheduled-job.controller';
import { GetScheduledJobInteractor } from './get-scheduled-job.interactor';
import { UpdateScheduledJobController } from './update-scheduled-job/update-scheduled-job.controller';
import { UpdateScheduledJobInteractor } from './update-scheduled-job/update-scheduled-job.interactor';
import { DeleteScheduledJobController } from './delete-scheduled-job.controller';
import { DeleteScheduledJobInteractor } from './delete-scheduled-job.interactor';
import { ListScheduledJobRunsController } from './list-scheduled-job-runs.controller';
import { ListScheduledJobRunsInteractor } from './list-scheduled-job-runs.interactor';
import { TriggerScheduledJobController } from './trigger-scheduled-job/trigger-scheduled-job.controller';
import { TriggerScheduledJobInteractor } from './trigger-scheduled-job/trigger-scheduled-job.interactor';
import { ScheduledJobDefinitionService } from './scheduled-job-definition.service';
import { ScheduledJobResponseFactory } from './scheduled-job-response.factory';

@Module({
  imports: [
    ScheduledJobsDomainModule,
    DockerImagesModule,
    ScheduledJobsServicesModule,
  ],
  controllers: [
    CreateScheduledJobController,
    ListScheduledJobsController,
    GetScheduledJobController,
    UpdateScheduledJobController,
    DeleteScheduledJobController,
    ListScheduledJobRunsController,
    TriggerScheduledJobController,
  ],
  providers: [
    CreateScheduledJobInteractor,
    ListScheduledJobsInteractor,
    GetScheduledJobInteractor,
    UpdateScheduledJobInteractor,
    DeleteScheduledJobInteractor,
    ListScheduledJobRunsInteractor,
    TriggerScheduledJobInteractor,
    ScheduledJobDefinitionService,
    ScheduledJobResponseFactory,
    ResponseService,
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
