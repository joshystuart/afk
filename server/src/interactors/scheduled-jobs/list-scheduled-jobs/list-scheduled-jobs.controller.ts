import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ListScheduledJobsInteractor } from './list-scheduled-jobs.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../../libs/response/response.service';
import { ScheduledJobResponseDto } from '../scheduled-job-response.dto';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import { ScheduledJobRoutes } from '../scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class ListScheduledJobsController {
  constructor(
    private readonly listScheduledJobsInteractor: ListScheduledJobsInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all scheduled jobs' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled jobs retrieved successfully',
    type: [ScheduledJobResponseDto],
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ApiErrorResponseDto,
  })
  async listScheduledJobs(): Promise<
    ApiResponseType<ScheduledJobResponseDto[]>
  > {
    const jobs = await this.listScheduledJobsInteractor.execute();
    const response = jobs.map(ScheduledJobResponseDto.fromDomain);
    return this.responseService.success(response);
  }
}
