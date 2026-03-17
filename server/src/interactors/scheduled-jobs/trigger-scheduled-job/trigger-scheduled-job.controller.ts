import {
  Controller,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TriggerScheduledJobInteractor } from './trigger-scheduled-job.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../../libs/response/response.service';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import {
  ScheduledJobRoutes,
  ScheduledJobRouteParams,
} from '../scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class TriggerScheduledJobController {
  constructor(
    private readonly triggerScheduledJobInteractor: TriggerScheduledJobInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Post(ScheduledJobRoutes.TRIGGER)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger immediate execution of a scheduled job' })
  @ApiParam({
    name: ScheduledJobRouteParams.ITEM_ID,
    description: 'Scheduled job ID',
  })
  @ApiResponse({
    status: 202,
    description: 'Job execution triggered',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled job not found',
    type: ApiErrorResponseDto,
  })
  async triggerJob(
    @Param(ScheduledJobRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<{ message: string }>> {
    try {
      await this.triggerScheduledJobInteractor.execute(id);
      return this.responseService.success(
        { message: 'Job execution triggered' },
        HttpStatus.ACCEPTED,
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to trigger scheduled job';
      if (message === 'Scheduled job not found') {
        throw new NotFoundException(message);
      }
      throw new BadRequestException(message);
    }
  }
}
