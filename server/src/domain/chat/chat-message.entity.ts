import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Index()
  @Column('varchar', { length: 36 })
  sessionId: string;

  @Column('varchar', { length: 16 })
  role: 'user' | 'assistant';

  @Column('text')
  content: string;

  @Column('json', { nullable: true })
  streamEvents: any[] | null;

  @Column('int', { nullable: true })
  streamEventCount: number | null;

  @Column('int', { nullable: true })
  streamByteCount: number | null;

  @Column('varchar', { length: 255, nullable: true })
  conversationId: string | null;

  @Column('boolean', { default: false })
  isContinuation: boolean;

  @Column('float', { nullable: true })
  costUsd: number | null;

  @Column('int', { nullable: true })
  durationMs: number | null;

  @CreateDateColumn()
  createdAt: Date;

  constructor(partial?: Partial<ChatMessage>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
