import {
  Controller,
  Put,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../../libs/response/response.service';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import { SessionIdDtoFactory } from '../../../domain/sessions/session-id-dto.factory';
import { AppConfig } from '../../../libs/config/app.config';
import { SessionRoutes, SessionRouteParams } from '../session.routes';
import { CreateSessionResponseDto } from '../create-session/create-session-response.dto';
import { UpdateSessionRequest } from './update-session-request.dto';
import { UpdateSessionInteractor } from './update-session.interactor';

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class UpdateSessionController {
  constructor(
    private readonly updateSessionInteractor: UpdateSessionInteractor,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
    private readonly appConfig: AppConfig,
  ) {}

  @Put(SessionRoutes.ITEM)
  @ApiOperation({ summary: 'Rename session' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiBody({ type: UpdateSessionRequest })
  @ApiResponse({
    status: 200,
    description: 'Session renamed successfully',
    type: CreateSessionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid session ID or request body',
    type: ApiErrorResponseDto,
  })
  async updateSession(
    @Param(SessionRouteParams.ITEM_ID) id: string,
    @Body() request: UpdateSessionRequest,
  ): Promise<ApiResponseType<CreateSessionResponseDto>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const updatedSession = await this.updateSessionInteractor.execute(
        sessionId,
        request,
      );

      const response = CreateSessionResponseDto.fromDomain(
        updatedSession,
        this.appConfig.baseUrl,
      );
      return this.responseService.success(response);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to rename session';
      if (message === 'Session not found') {
        throw new NotFoundException(message);
      }
      throw new BadRequestException(message);
    }
  }
}
