import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { ChatMessage } from '../../domain/chat/chat-message.entity';
import { ChatMessageRepository } from '../../domain/chat/chat-message.repository';
import { DockerModule } from '../docker/docker.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { DomainModule } from '../../domain/domain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    DockerModule,
    RepositoriesModule,
    DomainModule,
  ],
  providers: [ChatService, ChatMessageRepository],
  exports: [ChatService, ChatMessageRepository],
})
export class ChatModule {}
