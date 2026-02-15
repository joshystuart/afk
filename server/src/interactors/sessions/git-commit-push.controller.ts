import {
  Controller,
  Post,
  Param,
  Body,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { GitInteractor, CommitAndPushResult } from './git.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { SessionIdDtoFactory } from '../../domain/sessions/session-id-dto.factory';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';
import { SessionRoutes, SessionRouteParams } from './session.routes';

class CommitAndPushDto {
  @IsString()
  @IsNotEmpty()
  message!: string;
}

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class GitCommitPushController {
  private readonly logger = new Logger(GitCommitPushController.name);

  constructor(
    private readonly gitInteractor: GitInteractor,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  @Post(SessionRoutes.GIT_COMMIT_PUSH)
  @ApiOperation({ summary: 'Commit and push changes for session' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Commit and push completed',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid session ID, session not running, or commit failed',
    type: ApiErrorResponseDto,
  })
  async commitAndPush(
    @Param(SessionRouteParams.ITEM_ID) id: string,
    @Body() body: CommitAndPushDto,
  ): Promise<ApiResponseType<CommitAndPushResult>> {
    this.logger.log('Commit and push requested', {
      sessionId: id,
      messageLength: body.message?.length,
    });

    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const result = await this.gitInteractor.commitAndPush(
        sessionId,
        body.message,
      );

      this.logger.log('Commit and push completed', {
        sessionId: id,
        success: result.success,
      });

      return this.responseService.success(result);
    } catch (error) {
      this.logger.error('Commit and push failed', {
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
