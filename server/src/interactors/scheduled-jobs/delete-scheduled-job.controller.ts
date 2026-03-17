import {
  Controller,
  Delete,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DeleteScheduledJobInteractor } from './delete-scheduled-job.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';
import {
  ScheduledJobRoutes,
  ScheduledJobRouteParams,
} from './scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class DeleteScheduledJobController {
  constructor(
    private readonly deleteScheduledJobInteractor: DeleteScheduledJobInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Delete(ScheduledJobRoutes.ITEM)
  @ApiOperation({ summary: 'Delete a scheduled job' })
  @ApiParam({
    name: ScheduledJobRouteParams.ITEM_ID,
    description: 'Scheduled job ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Scheduled job deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Scheduled job not found',
    type: ApiErrorResponseDto,
  })
  async deleteScheduledJob(
    @Param(ScheduledJobRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<{ message: string }>> {
    try {
      await this.deleteScheduledJobInteractor.execute(id);
      return this.responseService.success({
        message: 'Scheduled job deleted successfully',
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete scheduled job';
      if (message === 'Scheduled job not found') {
        throw new NotFoundException(message);
      }
      throw new BadRequestException(message);
    }
  }
}
