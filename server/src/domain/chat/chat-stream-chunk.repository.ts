import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatStreamChunk } from './chat-stream-chunk.entity';

@Injectable()
export class ChatStreamChunkRepository {
  constructor(
    @InjectRepository(ChatStreamChunk)
    private readonly repository: Repository<ChatStreamChunk>,
  ) {}

  async save(chunk: ChatStreamChunk): Promise<void> {
    await this.repository.save(chunk);
  }

  async getMaxSequence(messageId: string): Promise<number> {
    const row = await this.repository
      .createQueryBuilder('c')
      .select('MAX(c.sequence)', 'max')
      .where('c.messageId = :messageId', { messageId })
      .getRawOne<{ max: number | null }>();
    return row?.max ?? 0;
  }

  async findByMessageIdOrdered(messageId: string): Promise<ChatStreamChunk[]> {
    return this.repository.find({
      where: { message: { id: messageId } },
      order: { sequence: 'ASC' },
    });
  }

  async deleteByMessageId(messageId: string): Promise<void> {
    await this.repository.delete({ message: { id: messageId } });
  }
}
