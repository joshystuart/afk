import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ListSessionsInteractor } from './list-sessions.interactor';
import { ResponseService, ApiResponse as ApiResponseType } from '../../../libs/response/response.service';
import { ListSessionsRequest } from './list-sessions-request.dto';
import { CreateSessionResponseDto } from '../create-session/create-session-response.dto';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import { AppConfig } from '../../../libs/config/app.config';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';

@ApiTags('Sessions')
@Controller('sessions')
export class ListSessionsController {
  constructor(
    private readonly listSessionsInteractor: ListSessionsInteractor,
    private readonly responseService: ResponseService,
    private readonly appConfig: AppConfig,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all sessions' })
  @ApiQuery({ name: 'status', required: false, enum: SessionStatus })
  @ApiResponse({ 
    status: 200, 
    description: 'Sessions retrieved successfully',
    type: [CreateSessionResponseDto]
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ApiErrorResponseDto
  })
  async listSessions(
    @Query('status') status?: SessionStatus,
  ): Promise<ApiResponseType<CreateSessionResponseDto[]>> {
    const request = new ListSessionsRequest();
    request.status = status;
    
    const sessions = await this.listSessionsInteractor.execute(request);

    const response = sessions.map(session => CreateSessionResponseDto.fromDomain(session, this.appConfig.baseUrl));
    return this.responseService.success(response);
  }
}