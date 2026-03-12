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
import { ChatService } from '../../services/chat/chat.service';
import { ChatMessage } from '../../domain/chat/chat-message.entity';
import { SessionRoutes, SessionRouteParams } from './session.routes';

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class ChatMessagesController {
  constructor(
    private readonly chatService: ChatService,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  @Get(SessionRoutes.MESSAGES)
  @ApiOperation({ summary: 'Get chat message history for a session' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiResponse({
    status: 200,
    description: 'Chat history retrieved',
  })
  async getMessages(
    @Param(SessionRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<ChatMessage[]>> {
    try {
      this.sessionIdFactory.fromString(id);
      const messages = await this.chatService.getHistory(id);
      return this.responseService.success(messages);
    } catch (error) {
      if (error.message === 'Invalid session ID') {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
