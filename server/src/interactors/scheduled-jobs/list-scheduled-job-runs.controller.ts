import {
  Controller,
  Get,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ListScheduledJobRunsInteractor } from './list-scheduled-job-runs.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { ScheduledJobRunResponseDto } from './scheduled-job-run-response.dto';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';
import {
  ScheduledJobRoutes,
  ScheduledJobRouteParams,
} from './scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class ListScheduledJobRunsController {
  constructor(
    private readonly listScheduledJobRunsInteractor: ListScheduledJobRunsInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Get(ScheduledJobRoutes.RUNS)
  @ApiOperation({ summary: 'List runs for a scheduled job' })
  @ApiParam({
    name: ScheduledJobRouteParams.ITEM_ID,
    description: 'Scheduled job ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled job runs retrieved successfully',
    type: [ScheduledJobRunResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled job not found',
    type: ApiErrorResponseDto,
  })
  async listScheduledJobRuns(
    @Param(ScheduledJobRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<ScheduledJobRunResponseDto[]>> {
    try {
      const runs = await this.listScheduledJobRunsInteractor.execute(id);
      const response = runs.map(ScheduledJobRunResponseDto.fromDomain);
      return this.responseService.success(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to list scheduled job runs';
      if (message === 'Scheduled job not found') {
        throw new NotFoundException(message);
      }
      throw new BadRequestException(message);
    }
  }
}
