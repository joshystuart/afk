import { ChatMessage } from '../../domain/chat/chat-message.entity';

export class ChatMessageResponseDto {
  id!: string;
  sessionId!: string;
  role!: 'user' | 'assistant';
  content!: string;
  conversationId?: string;
  isContinuation!: boolean;
  costUsd?: number;
  durationMs?: number;
  streamEventCount?: number;
  streamByteCount?: number;
  createdAt!: string;

  static fromDomain(message: ChatMessage): ChatMessageResponseDto {
    const dto = new ChatMessageResponseDto();
    dto.id = message.id;
    dto.sessionId = message.sessionId;
    dto.role = message.role;
    dto.content = message.content;
    dto.conversationId = message.conversationId || undefined;
    dto.isContinuation = message.isContinuation;
    dto.costUsd = message.costUsd ?? undefined;
    dto.durationMs = message.durationMs ?? undefined;
    dto.streamEventCount = message.streamEventCount ?? undefined;
    dto.streamByteCount = message.streamByteCount ?? undefined;
    dto.createdAt = message.createdAt?.toISOString();
    return dto;
  }
}
