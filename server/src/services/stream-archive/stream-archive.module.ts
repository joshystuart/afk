import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatStreamChunk } from '../../domain/chat/chat-stream-chunk.entity';
import { ChatStreamChunkRepository } from '../../domain/chat/chat-stream-chunk.repository';
import { ScheduledJobRunStreamChunk } from '../../domain/scheduled-jobs/scheduled-job-run-stream-chunk.entity';
import { ScheduledJobRunStreamChunkRepository } from '../../domain/scheduled-jobs/scheduled-job-run-stream-chunk.repository';
import { ClaudeEventArchiveService } from './claude-event-archive.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatStreamChunk, ScheduledJobRunStreamChunk]),
  ],
  providers: [
    ChatStreamChunkRepository,
    ScheduledJobRunStreamChunkRepository,
    ClaudeEventArchiveService,
  ],
  exports: [ClaudeEventArchiveService],
})
export class StreamArchiveModule {}
