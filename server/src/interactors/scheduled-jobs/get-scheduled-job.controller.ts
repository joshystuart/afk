import {
  Controller,
  Get,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GetScheduledJobInteractor } from './get-scheduled-job.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { ScheduledJobResponseDto } from './scheduled-job-response.dto';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';
import {
  ScheduledJobRoutes,
  ScheduledJobRouteParams,
} from './scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class GetScheduledJobController {
  constructor(
    private readonly getScheduledJobInteractor: GetScheduledJobInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Get(ScheduledJobRoutes.ITEM)
  @ApiOperation({ summary: 'Get scheduled job details' })
  @ApiParam({
    name: ScheduledJobRouteParams.ITEM_ID,
    description: 'Scheduled job ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled job details retrieved',
    type: ScheduledJobResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled job not found',
    type: ApiErrorResponseDto,
  })
  async getScheduledJob(
    @Param(ScheduledJobRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<ScheduledJobResponseDto>> {
    try {
      const job = await this.getScheduledJobInteractor.execute(id);
      const response = ScheduledJobResponseDto.fromDomain(job);
      return this.responseService.success(response);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to get scheduled job';
      if (message === 'Scheduled job not found') {
        throw new NotFoundException(message);
      }
      throw new BadRequestException(message);
    }
  }
}
