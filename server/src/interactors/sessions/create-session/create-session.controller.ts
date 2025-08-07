import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateSessionInteractor } from './create-session.interactor';
import { ResponseService, ApiResponse as ApiResponseType } from '../../../libs/response/response.service';
import { CreateSessionRequest } from './create-session-request.dto';
import { CreateSessionResponseDto } from './create-session-response.dto';

@ApiTags('Sessions')
@Controller('sessions')
export class CreateSessionController {
  constructor(
    private readonly createSessionInteractor: CreateSessionInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create new session',
    description: 'Creates a new containerized session with optional git integration',
  })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createSession(
    @Body() request: CreateSessionRequest,
  ): Promise<ApiResponseType<CreateSessionResponseDto>> {
    try {
      const session = await this.createSessionInteractor.execute(request);

      const response = CreateSessionResponseDto.fromDomain(session);
      return this.responseService.success(response, 201);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}