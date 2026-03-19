import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_stream_chunks')
@Index(['message', 'sequence'], { unique: true })
export class ChatStreamChunk {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @ManyToOne(() => ChatMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: ChatMessage;

  @Column('int')
  sequence: number;

  @Column('text')
  payload: string;

  @Column('int')
  eventCount: number;

  @Column('int')
  byteLength: number;

  @CreateDateColumn()
  createdAt: Date;

  constructor(partial?: Partial<ChatStreamChunk>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
