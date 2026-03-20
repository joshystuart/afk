import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../../domain/chat/chat-message.entity';
import { ChatStreamChunk } from '../../domain/chat/chat-stream-chunk.entity';
import { ChatStreamChunkRepository } from '../../domain/chat/chat-stream-chunk.repository';
import { ScheduledJobRun } from '../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunStreamChunk } from '../../domain/scheduled-jobs/scheduled-job-run-stream-chunk.entity';
import { ScheduledJobRunStreamChunkRepository } from '../../domain/scheduled-jobs/scheduled-job-run-stream-chunk.repository';

const MAX_CHUNK_EVENTS = 100;
const MAX_CHUNK_BYTES = 128 * 1024;

export interface StreamArchiveTotals {
  eventCount: number;
  byteCount: number;
}

export interface StreamArchiveWriter {
  appendEvent(event: unknown): Promise<void>;
  finalize(): Promise<StreamArchiveTotals>;
}

type PersistChunkFn = (args: {
  sequence: number;
  payload: string;
  eventCount: number;
  byteLength: number;
}) => Promise<void>;

class NdjsonChunkWriter implements StreamArchiveWriter {
  private buffer = '';
  private bufferEventCount = 0;
  private totalEvents = 0;
  private totalBytes = 0;
  private nextSequence = 0;
  private sequenceInitialized = false;

  constructor(
    private readonly getMaxSequence: () => Promise<number>,
    private readonly persistChunk: PersistChunkFn,
  ) {}

  async appendEvent(event: unknown): Promise<void> {
    const line = JSON.stringify(event) + '\n';
    if (!this.sequenceInitialized) {
      const max = await this.getMaxSequence();
      this.nextSequence = max + 1;
      this.sequenceInitialized = true;
    }
    this.buffer += line;
    this.bufferEventCount++;
    this.totalEvents++;
    this.totalBytes += Buffer.byteLength(line, 'utf8');
    if (
      this.bufferEventCount >= MAX_CHUNK_EVENTS ||
      Buffer.byteLength(this.buffer, 'utf8') >= MAX_CHUNK_BYTES
    ) {
      await this.flush();
    }
  }

  async finalize(): Promise<StreamArchiveTotals> {
    if (this.bufferEventCount > 0) {
      await this.flush();
    }
    return { eventCount: this.totalEvents, byteCount: this.totalBytes };
  }

  private async flush(): Promise<void> {
    if (this.bufferEventCount === 0) {
      return;
    }
    const byteLength = Buffer.byteLength(this.buffer, 'utf8');
    await this.persistChunk({
      sequence: this.nextSequence++,
      payload: this.buffer,
      eventCount: this.bufferEventCount,
      byteLength,
    });
    this.buffer = '';
    this.bufferEventCount = 0;
  }
}

export interface ArchiveMetrics {
  totalChunksWritten: number;
  totalBytesArchived: number;
  chatChunksWritten: number;
  chatBytesArchived: number;
  jobRunChunksWritten: number;
  jobRunBytesArchived: number;
}

@Injectable()
export class ClaudeEventArchiveService {
  private readonly logger = new Logger(ClaudeEventArchiveService.name);

  private _chatChunksWritten = 0;
  private _chatBytesArchived = 0;
  private _jobRunChunksWritten = 0;
  private _jobRunBytesArchived = 0;

  constructor(
    private readonly chatStreamChunkRepository: ChatStreamChunkRepository,
    private readonly scheduledJobRunStreamChunkRepository: ScheduledJobRunStreamChunkRepository,
  ) {}

  createChatWriter(messageId: string): StreamArchiveWriter {
    return new NdjsonChunkWriter(
      () => this.chatStreamChunkRepository.getMaxSequence(messageId),
      async (args) => {
        await this.chatStreamChunkRepository.save(
          new ChatStreamChunk({
            id: uuidv4(),
            message: { id: messageId } as ChatMessage,
            sequence: args.sequence,
            payload: args.payload,
            eventCount: args.eventCount,
            byteLength: args.byteLength,
          }),
        );
        this._chatChunksWritten++;
        this._chatBytesArchived += args.byteLength;
      },
    );
  }

  createJobRunWriter(runId: string): StreamArchiveWriter {
    return new NdjsonChunkWriter(
      () => this.scheduledJobRunStreamChunkRepository.getMaxSequence(runId),
      async (args) => {
        await this.scheduledJobRunStreamChunkRepository.save(
          new ScheduledJobRunStreamChunk({
            id: uuidv4(),
            run: { id: runId } as ScheduledJobRun,
            sequence: args.sequence,
            payload: args.payload,
            eventCount: args.eventCount,
            byteLength: args.byteLength,
          }),
        );
        this._jobRunChunksWritten++;
        this._jobRunBytesArchived += args.byteLength;
      },
    );
  }

  getMetrics(): ArchiveMetrics {
    return {
      totalChunksWritten: this._chatChunksWritten + this._jobRunChunksWritten,
      totalBytesArchived: this._chatBytesArchived + this._jobRunBytesArchived,
      chatChunksWritten: this._chatChunksWritten,
      chatBytesArchived: this._chatBytesArchived,
      jobRunChunksWritten: this._jobRunChunksWritten,
      jobRunBytesArchived: this._jobRunBytesArchived,
    };
  }

  async loadEventsForMessage(messageId: string): Promise<any[]> {
    const chunks =
      await this.chatStreamChunkRepository.findByMessageIdOrdered(messageId);
    return this.parseChunks(chunks.map((c) => c.payload));
  }

  async loadEventsForJobRun(runId: string): Promise<any[]> {
    const chunks =
      await this.scheduledJobRunStreamChunkRepository.findByRunIdOrdered(runId);
    return this.parseChunks(chunks.map((c) => c.payload));
  }

  private parseChunks(payloads: string[]): any[] {
    const events: any[] = [];
    for (const payload of payloads) {
      for (const line of payload.split('\n')) {
        if (line.trim() === '') {
          continue;
        }
        try {
          events.push(JSON.parse(line));
        } catch (err) {
          this.logger.warn('Failed to parse archived stream line', {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
    }
    return events;
  }
}
