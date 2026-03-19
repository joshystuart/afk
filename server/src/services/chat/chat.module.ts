import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ClaudeStreamRunnerService } from './claude-stream-runner.service';
import { ChatMessage } from '../../domain/chat/chat-message.entity';
import { ChatMessageRepository } from '../../domain/chat/chat-message.repository';
import { DockerModule } from '../docker/docker.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { DomainModule } from '../../domain/domain.module';
import { StreamArchiveModule } from '../stream-archive/stream-archive.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    DockerModule,
    RepositoriesModule,
    DomainModule,
    StreamArchiveModule,
  ],
  providers: [ChatService, ChatMessageRepository, ClaudeStreamRunnerService],
  exports: [ChatService, ChatMessageRepository, ClaudeStreamRunnerService],
})
export class ChatModule {}
