import { Controller, Delete, Post, Get, Param, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { SessionLifecycleInteractor } from './session-lifecycle.interactor';
import { ResponseService, ApiResponse as ApiResponseType } from '../../libs/response/response.service';
import { SessionIdDtoFactory } from '../../domain/sessions/session-id-dto.factory';
import { CreateSessionResponseDto } from './create-session/create-session-response.dto';
import { AppConfig } from '../../libs/config/app.config';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionLifecycleController {
  constructor(
    private readonly sessionLifecycleInteractor: SessionLifecycleInteractor,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
    private readonly appConfig: AppConfig,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get session details' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session details retrieved' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async getSession(@Param('id') id: string): Promise<ApiResponseType<CreateSessionResponseDto>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const sessionInfo = await this.sessionLifecycleInteractor.getSessionInfo(sessionId);
      
      const response = CreateSessionResponseDto.fromDomain(sessionInfo.session, this.appConfig.baseUrl);
      return this.responseService.success(response);
    } catch (error) {
      if (error.message === 'Session not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/stop')
  @ApiOperation({ summary: 'Stop session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session stopped successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async stopSession(@Param('id') id: string): Promise<ApiResponseType<{ message: string }>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      await this.sessionLifecycleInteractor.stopSession(sessionId);
      
      return this.responseService.success({ message: 'Session stopped successfully' });
    } catch (error) {
      if (error.message === 'Session not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/restart')
  @ApiOperation({ summary: 'Restart session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session restarted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async restartSession(@Param('id') id: string): Promise<ApiResponseType<{ message: string }>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      await this.sessionLifecycleInteractor.restartSession(sessionId);
      
      return this.responseService.success({ message: 'Session restarted successfully' });
    } catch (error) {
      if (error.message === 'Session not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete session' })
  @ApiParam({ name: 'id', description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  @ApiResponse({ status: 404, description: 'Session not found' })
  async deleteSession(@Param('id') id: string): Promise<ApiResponseType<{ message: string }>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      await this.sessionLifecycleInteractor.deleteSession(sessionId);
      
      return this.responseService.success({ message: 'Session deleted successfully' });
    } catch (error) {
      if (error.message === 'Session not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}