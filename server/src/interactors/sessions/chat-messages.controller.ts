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
import { ChatMessageResponseDto } from './chat-message-response.dto';
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
  async getMessages(@Param(SessionRouteParams.ITEM_ID) id: string): Promise<
    ApiResponseType<{
      messages: ChatMessageResponseDto[];
      isExecuting: boolean;
      activeMessageId: string | null;
    }>
  > {
    try {
      this.sessionIdFactory.fromString(id);
      const messages = await this.chatService.getHistory(id);
      const executionInfo = this.chatService.getExecutionInfo(id);
      return this.responseService.success({
        messages: messages.map(ChatMessageResponseDto.fromDomain),
        isExecuting: executionInfo !== null,
        activeMessageId: executionInfo?.assistantMessageId ?? null,
      });
    } catch (error) {
      if (error.message === 'Invalid session ID') {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
