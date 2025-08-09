import {
  Controller,
  Post,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionLifecycleInteractor } from './session-lifecycle.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { SessionIdDtoFactory } from '../../domain/sessions/session-id-dto.factory';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';
import { SessionRoutes, SessionRouteParams } from './session.routes';

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class RestartSessionController {
  constructor(
    private readonly sessionLifecycleInteractor: SessionLifecycleInteractor,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  @Post(SessionRoutes.RESTART)
  @ApiOperation({ summary: 'Restart session' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Session restarted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid session ID or operation failed',
    type: ApiErrorResponseDto,
  })
  async restartSession(
    @Param(SessionRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<{ message: string }>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      await this.sessionLifecycleInteractor.restartSession(sessionId);

      return this.responseService.success({
        message: 'Session restarted successfully',
      });
    } catch (error) {
      if (error.message === 'Session not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}