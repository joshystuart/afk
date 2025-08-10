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
import { CreateSessionResponseDto } from './create-session/create-session-response.dto';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';
import { AppConfig } from '../../libs/config/app.config';
import { SessionRoutes, SessionRouteParams } from './session.routes';

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class GetSessionController {
  constructor(
    private readonly sessionLifecycleInteractor: SessionLifecycleInteractor,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
    private readonly appConfig: AppConfig,
  ) {}

  @Get(SessionRoutes.ITEM)
  @ApiOperation({ summary: 'Get session details' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Session details retrieved',
    type: CreateSessionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid session ID',
    type: ApiErrorResponseDto,
  })
  async getSession(
    @Param(SessionRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<CreateSessionResponseDto>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const sessionInfo =
        await this.sessionLifecycleInteractor.getSessionInfo(sessionId);

      const response = CreateSessionResponseDto.fromDomain(
        sessionInfo.session,
        this.appConfig.baseUrl,
      );
      return this.responseService.success(response);
    } catch (error) {
      if (error.message === 'Session not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
