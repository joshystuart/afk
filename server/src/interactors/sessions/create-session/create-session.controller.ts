import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateSessionInteractor } from './create-session.interactor';
import { ResponseService, ApiResponse as ApiResponseType } from '../../../libs/response/response.service';
import { CreateSessionRequest } from './create-session-request.dto';
import { CreateSessionResponseDto } from './create-session-response.dto';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import { AppConfig } from '../../../libs/config/app.config';

@ApiTags('Sessions')
@Controller('sessions')
export class CreateSessionController {
  constructor(
    private readonly createSessionInteractor: CreateSessionInteractor,
    private readonly responseService: ResponseService,
    private readonly appConfig: AppConfig,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create new session',
    description: 'Creates a new containerized session with optional git integration',
  })
  @ApiBody({ type: CreateSessionRequest })
  @ApiResponse({ 
    status: 201, 
    description: 'Session created successfully',
    type: CreateSessionResponseDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Validation error or session creation failed',
    type: ApiErrorResponseDto 
  })
  async createSession(
    @Body() request: CreateSessionRequest,
  ): Promise<ApiResponseType<CreateSessionResponseDto>> {
    try {
      const session = await this.createSessionInteractor.execute(request);

      const response = CreateSessionResponseDto.fromDomain(session, this.appConfig.baseUrl);
      return this.responseService.success(response, 201);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
