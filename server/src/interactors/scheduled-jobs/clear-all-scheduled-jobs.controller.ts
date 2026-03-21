import { Controller, Delete, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ClearAllScheduledJobsInteractor,
  ClearAllScheduledJobsResult,
} from './clear-all-scheduled-jobs.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';
import { ScheduledJobRoutes } from './scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class ClearAllScheduledJobsController {
  constructor(
    private readonly clearAllScheduledJobsInteractor: ClearAllScheduledJobsInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Delete(ScheduledJobRoutes.CLEAR_ALL)
  @ApiOperation({ summary: 'Clear all scheduled jobs' })
  @ApiResponse({
    status: 200,
    description: 'All scheduled jobs cleared successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Operation failed',
    type: ApiErrorResponseDto,
  })
  async clearAllScheduledJobs(): Promise<
    ApiResponseType<ClearAllScheduledJobsResult>
  > {
    try {
      const result = await this.clearAllScheduledJobsInteractor.execute();
      return this.responseService.success(result);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to clear scheduled jobs',
      );
    }
  }
}
