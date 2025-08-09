import {
  Controller,
  Get,
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
export class CheckSessionHealthController {
  constructor(
    private readonly sessionLifecycleInteractor: SessionLifecycleInteractor,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  @Get(SessionRoutes.HEALTH)
  @ApiOperation({ summary: 'Check if session terminals are ready' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Terminal health status',
    schema: {
      type: 'object',
      properties: {
        claudeTerminalReady: { type: 'boolean' },
        manualTerminalReady: { type: 'boolean' },
        allReady: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: ApiErrorResponseDto,
  })
  async checkSessionHealth(
    @Param(SessionRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<{ claudeTerminalReady: boolean; manualTerminalReady: boolean; allReady: boolean }>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const healthStatus = await this.sessionLifecycleInteractor.checkTerminalHealth(sessionId);

      return this.responseService.success(healthStatus);
    } catch (error) {
      if (error.message === 'Session not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}