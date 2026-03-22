import {
  Controller,
  Get,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { SessionIdDtoFactory } from '../../domain/sessions/session-id-dto.factory';
import { ChatService } from './chat/chat.service';
import { SessionRoutes, SessionRouteParams } from './session.routes';

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class GetChatMessageStreamController {
  constructor(
    private readonly chatService: ChatService,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  @Get(SessionRoutes.MESSAGE_STREAM)
  @ApiOperation({ summary: 'Get full stream transcript for a chat message' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiParam({
    name: SessionRouteParams.MESSAGE_ID,
    description: 'Message ID',
  })
  @ApiResponse({ status: 200, description: 'Stream transcript retrieved' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async getMessageStream(
    @Param(SessionRouteParams.ITEM_ID) sessionId: string,
    @Param(SessionRouteParams.MESSAGE_ID) messageId: string,
  ): Promise<ApiResponseType<{ events: any[] }>> {
    try {
      this.sessionIdFactory.fromString(sessionId);
      const events = await this.chatService.loadStreamEventsForMessage(
        sessionId,
        messageId,
      );
      return this.responseService.success({ events });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load stream';
      if (message === 'Message not found') {
        throw new NotFoundException(message);
      }
      if (message === 'Invalid session ID') {
        throw new BadRequestException(message);
      }
      throw new BadRequestException(message);
    }
  }
}
