import {
  Controller,
  Get,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { ScheduledJobRunRepository } from '../../domain/scheduled-jobs/scheduled-job-run.repository';
import { ClaudeEventArchiveService } from '../../libs/stream-archive/claude-event-archive.service';
import {
  ScheduledJobRoutes,
  ScheduledJobRouteParams,
} from './scheduled-job.routes';

@ApiTags('Scheduled Jobs')
@Controller(ScheduledJobRoutes.BASE)
export class GetScheduledJobRunStreamController {
  constructor(
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
    private readonly claudeEventArchive: ClaudeEventArchiveService,
    private readonly responseService: ResponseService,
  ) {}

  @Get(ScheduledJobRoutes.RUN_STREAM)
  @ApiOperation({
    summary: 'Get full stream transcript for a scheduled job run',
  })
  @ApiParam({
    name: ScheduledJobRouteParams.RUN_ID,
    description: 'Run ID',
  })
  @ApiResponse({ status: 200, description: 'Stream transcript retrieved' })
  @ApiResponse({ status: 404, description: 'Run not found' })
  async getRunStream(
    @Param(ScheduledJobRouteParams.RUN_ID) runId: string,
  ): Promise<ApiResponseType<{ events: any[] }>> {
    const run = await this.scheduledJobRunRepository.findById(runId);
    if (!run) {
      throw new NotFoundException('Run not found');
    }

    try {
      const events = await this.claudeEventArchive.loadEventsForJobRun(runId);
      return this.responseService.success({ events });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load stream';
      throw new BadRequestException(message);
    }
  }
}
