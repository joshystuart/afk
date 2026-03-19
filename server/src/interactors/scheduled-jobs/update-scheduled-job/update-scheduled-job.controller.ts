import {
  Controller,
  Put,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { UpdateScheduledJobInteractor } from './update-scheduled-job.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../../libs/response/response.service';
import { UpdateScheduledJobRequest } from './update-scheduled-job-request.dto';
import { ScheduledJobResponseDto } from '../scheduled-job-response.dto';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import {
  ScheduledJobRoutes,
  ScheduledJobRouteParams,
} from '../scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class UpdateScheduledJobController {
  constructor(
    private readonly updateScheduledJobInteractor: UpdateScheduledJobInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Put(ScheduledJobRoutes.ITEM)
  @ApiOperation({ summary: 'Update a scheduled job' })
  @ApiParam({
    name: ScheduledJobRouteParams.ITEM_ID,
    description: 'Scheduled job ID',
  })
  @ApiBody({ type: UpdateScheduledJobRequest })
  @ApiResponse({
    status: 200,
    description: 'Scheduled job updated successfully',
    type: ScheduledJobResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled job not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request body',
    type: ApiErrorResponseDto,
  })
  async updateScheduledJob(
    @Param(ScheduledJobRouteParams.ITEM_ID) id: string,
    @Body() request: UpdateScheduledJobRequest,
  ): Promise<ApiResponseType<ScheduledJobResponseDto>> {
    try {
      const job = await this.updateScheduledJobInteractor.execute(id, request);
      const response = ScheduledJobResponseDto.fromDomain(job);
      return this.responseService.success(response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update scheduled job';
      if (message === 'Scheduled job not found') {
        throw new NotFoundException(message);
      }
      throw new BadRequestException(message);
    }
  }
}
