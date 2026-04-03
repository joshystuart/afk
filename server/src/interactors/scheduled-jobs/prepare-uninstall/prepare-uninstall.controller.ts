import { BadRequestException, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import {
  ApiResponse as ApiResponseType,
  ResponseService,
} from '../../../libs/response/response.service';
import { ScheduledJobRoutes } from '../scheduled-job.routes';
import {
  PrepareScheduledJobsUninstallResult,
  PrepareUninstallInteractor,
} from './prepare-uninstall.interactor';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class PrepareUninstallController {
  constructor(
    private readonly prepareUninstallInteractor: PrepareUninstallInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Post(ScheduledJobRoutes.PREPARE_UNINSTALL)
  @ApiOperation({
    summary: 'Prepare desktop schedules for uninstall',
    description:
      'Disables scheduled jobs and removes AFK launchd LaunchAgents so the desktop app can be safely removed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Desktop schedules prepared for uninstall successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Operation failed',
    type: ApiErrorResponseDto,
  })
  async prepareUninstall(): Promise<
    ApiResponseType<PrepareScheduledJobsUninstallResult>
  > {
    try {
      const result = await this.prepareUninstallInteractor.execute();
      return this.responseService.success(result);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : 'Failed to prepare desktop schedules for uninstall',
      );
    }
  }
}
