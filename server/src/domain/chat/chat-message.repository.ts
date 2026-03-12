import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Injectable()
export class ChatMessageRepository {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly repository: Repository<ChatMessage>,
  ) {}

  async save(message: ChatMessage): Promise<void> {
    await this.repository.save(message);
  }

  async findBySessionId(sessionId: string): Promise<ChatMessage[]> {
    return this.repository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' },
    });
  }

  async findLastConversationId(sessionId: string): Promise<string | null> {
    const message = await this.repository.findOne({
      where: { sessionId, role: 'assistant' },
      order: { createdAt: 'DESC' },
    });
    return message?.conversationId ?? null;
  }

  async deleteBySessionId(sessionId: string): Promise<void> {
    await this.repository.delete({ sessionId });
  }
}
