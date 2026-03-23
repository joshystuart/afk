import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from '../../../domain/chat/chat-message.entity';
import { ChatMessageRepository } from '../../../domain/chat/chat-message.repository';
import { DomainModule } from '../../../domain/domain.module';
import { ClaudeStreamRunnerService } from '../../../libs/claude/claude-stream-runner.service';
import { DockerModule } from '../../../libs/docker/docker.module';
import { SessionPersistenceModule } from '../../../libs/sessions/session-persistence.module';
import { StreamArchiveModule } from '../../../libs/stream-archive/stream-archive.module';
import { ChatService } from './chat.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    DockerModule,
    SessionPersistenceModule,
    DomainModule,
    StreamArchiveModule,
  ],
  providers: [ChatService, ChatMessageRepository, ClaudeStreamRunnerService],
  exports: [ChatService, ChatMessageRepository, ClaudeStreamRunnerService],
})
export class ChatModule {}
