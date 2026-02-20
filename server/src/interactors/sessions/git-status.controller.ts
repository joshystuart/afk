import {
  Controller,
  Get,
  Param,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GitInteractor, GitStatusResult } from './git.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { SessionIdDtoFactory } from '../../domain/sessions/session-id-dto.factory';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';
import { SessionRoutes, SessionRouteParams } from './session.routes';

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class GitStatusController {
  private readonly logger = new Logger(GitStatusController.name);

  constructor(
    private readonly gitInteractor: GitInteractor,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  @Get(SessionRoutes.GIT_STATUS)
  @ApiOperation({ summary: 'Get git status for session' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Git status retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid session ID or session not running',
    type: ApiErrorResponseDto,
  })
  async getGitStatus(
    @Param(SessionRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<GitStatusResult>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const status = await this.gitInteractor.getGitStatus(sessionId);

      this.logger.debug('Git status retrieved', {
        sessionId: id,
        hasChanges: status.hasChanges,
        changedFileCount: status.changedFileCount,
        branch: status.branch,
      });

      return this.responseService.success(status);
    } catch (error) {
      this.logger.error('Failed to get git status', {
        sessionId: id,
        error: error.message,
      });

      if (error.message === 'Session not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
