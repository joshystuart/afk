import { Injectable, Logger } from '@nestjs/common';
import { DockerEngineService } from '../docker/docker-engine.service';
import { NdjsonParser } from './ndjson-parser';
import type { StreamArchiveWriter } from '../stream-archive/claude-event-archive.service';

export interface ClaudeStreamRunnerOptions {
  containerId: string;
  prompt: string;
  workingDir: string;
  continueConversation?: boolean;
  model?: string;
  includePartialMessages?: boolean;
  onEvent?: (event: any) => void | Promise<void>;
  archiveWriter?: StreamArchiveWriter;
}

export interface ClaudeStreamRunnerResult {
  streamEventCount: number;
  streamByteCount: number;
  conversationId: string | null;
  costUsd: number | null;
  resultContent: string;
  durationMs: number;
}

export interface ClaudeStreamRunnerHandle {
  result: Promise<ClaudeStreamRunnerResult>;
  kill: () => Promise<void>;
}

export class ClaudeStreamExecutionError extends Error {
  constructor(
    message: string,
    public readonly partialResult: ClaudeStreamRunnerResult,
  ) {
    super(message);
    this.name = ClaudeStreamExecutionError.name;
  }
}

@Injectable()
export class ClaudeStreamRunnerService {
  private readonly logger = new Logger(ClaudeStreamRunnerService.name);

  constructor(private readonly dockerEngine: DockerEngineService) {}

  async startPrompt(
    options: ClaudeStreamRunnerOptions,
  ): Promise<ClaudeStreamRunnerHandle> {
    const parser = new NdjsonParser();
    const startTime = Date.now();

    let conversationId: string | null = null;
    let costUsd: string | number | null = null;
    let resultContent = '';
    let completed = false;
    let streamEventCount = 0;
    let streamByteCount = 0;
    let finalizeExecution: (() => void) | null = null;

    let processChain: Promise<void> = Promise.resolve();

    const schedule = (fn: () => Promise<void>) => {
      processChain = processChain.then(fn);
    };

    const countEvent = (event: any) => {
      const line = JSON.stringify(event) + '\n';
      streamEventCount++;
      streamByteCount += Buffer.byteLength(line, 'utf8');
    };

    const finalizeArchive = async (): Promise<{
      eventCount: number;
      byteCount: number;
    }> => {
      if (options.archiveWriter) {
        return options.archiveWriter.finalize();
      }
      return { eventCount: streamEventCount, byteCount: streamByteCount };
    };

    const notifyEvent = (event: any) => {
      if (!options.onEvent) {
        return;
      }

      Promise.resolve(options.onEvent(event)).catch((error: unknown) => {
        this.logger.warn('Failed to process Claude stream event', {
          containerId: options.containerId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    };

    const handleEvent = async (event: any) => {
      countEvent(event);
      if (options.archiveWriter) {
        await options.archiveWriter.appendEvent(event);
      }
      notifyEvent(event);

      if (event.type === 'result') {
        conversationId = event.session_id ?? null;
        costUsd = event.cost_usd ?? null;
        resultContent = event.result ?? '';
        finalizeExecution?.();
      }
    };

    const cmd = this.buildClaudeCommand(options);
    const { stream, kill } = await this.dockerEngine.execStreamInContainer(
      options.containerId,
      cmd,
      (chunk: string) => {
        const events = parser.parse(chunk);
        for (const event of events) {
          schedule(() => handleEvent(event));
        }
      },
      options.workingDir,
    );

    const result = new Promise<ClaudeStreamRunnerResult>((resolve, reject) => {
      const finalize = async () => {
        if (completed) {
          return;
        }
        completed = true;

        const archiveTotals = await finalizeArchive();

        resolve({
          streamEventCount: archiveTotals.eventCount,
          streamByteCount: archiveTotals.byteCount,
          conversationId,
          costUsd: typeof costUsd === 'number' ? costUsd : null,
          resultContent,
          durationMs: Date.now() - startTime,
        });

        kill().catch((error: unknown) => {
          this.logger.warn('Failed to kill Claude exec stream', {
            containerId: options.containerId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      };

      finalizeExecution = () => {
        schedule(finalize);
      };

      const fail = async (error: Error) => {
        if (completed) {
          return;
        }
        completed = true;

        const archiveTotals = await finalizeArchive().catch(() => ({
          eventCount: streamEventCount,
          byteCount: streamByteCount,
        }));

        reject(
          new ClaudeStreamExecutionError(error.message, {
            streamEventCount: archiveTotals.eventCount,
            streamByteCount: archiveTotals.byteCount,
            conversationId,
            costUsd: typeof costUsd === 'number' ? costUsd : null,
            resultContent,
            durationMs: Date.now() - startTime,
          }),
        );
      };

      stream.on('end', () => {
        const remaining = parser.flush();
        for (const event of remaining) {
          schedule(() => handleEvent(event));
        }
        schedule(finalize);
      });

      stream.on('error', (error: Error) => {
        if (completed) {
          return;
        }

        schedule(() => fail(error));
      });
    });

    return {
      result,
      kill,
    };
  }

  private buildClaudeCommand(options: ClaudeStreamRunnerOptions): string[] {
    const cmd = [
      'claude',
      '-p',
      options.prompt,
      '--output-format',
      'stream-json',
      '--verbose',
      '--dangerously-skip-permissions',
    ];

    if (options.includePartialMessages) {
      cmd.push('--include-partial-messages');
    }

    if (options.model) {
      cmd.push('--model', options.model);
    }

    if (options.continueConversation) {
      cmd.push('--continue');
    }

    return cmd;
  }
}
