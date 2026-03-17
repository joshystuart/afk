import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateScheduledJobInteractor } from './create-scheduled-job.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../../libs/response/response.service';
import { CreateScheduledJobRequest } from './create-scheduled-job-request.dto';
import { ScheduledJobResponseDto } from '../scheduled-job-response.dto';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import { ScheduledJobRoutes } from '../scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class CreateScheduledJobController {
  constructor(
    private readonly createScheduledJobInteractor: CreateScheduledJobInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new scheduled job' })
  @ApiBody({ type: CreateScheduledJobRequest })
  @ApiResponse({
    status: 201,
    description: 'Scheduled job created successfully',
    type: ScheduledJobResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    type: ApiErrorResponseDto,
  })
  async createScheduledJob(
    @Body() request: CreateScheduledJobRequest,
  ): Promise<ApiResponseType<ScheduledJobResponseDto>> {
    try {
      const job = await this.createScheduledJobInteractor.execute(request);
      const response = ScheduledJobResponseDto.fromDomain(job);
      return this.responseService.success(response, 201);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to create job',
      );
    }
  }
}
