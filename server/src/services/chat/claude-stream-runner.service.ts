import { Injectable, Logger } from '@nestjs/common';
import { DockerEngineService } from '../docker/docker-engine.service';
import { NdjsonParser } from './ndjson-parser';

export interface ClaudeStreamRunnerOptions {
  containerId: string;
  prompt: string;
  workingDir: string;
  continueConversation?: boolean;
  model?: string;
  includePartialMessages?: boolean;
  persistEveryEvents?: number;
  onEvent?: (event: any) => void | Promise<void>;
  onPersistSnapshot?: (streamEvents: any[]) => Promise<void>;
}

export interface ClaudeStreamRunnerResult {
  streamEvents: any[];
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
    const streamEvents: any[] = [];
    const persistEveryEvents = options.persistEveryEvents ?? 15;
    const startTime = Date.now();

    let conversationId: string | null = null;
    let costUsd: number | null = null;
    let resultContent = '';
    let completed = false;
    let lastPersistedCount = 0;
    let pendingPersist: Promise<void> | null = null;
    let finalizeExecution: (() => void) | null = null;

    const buildResult = (): ClaudeStreamRunnerResult => ({
      streamEvents: [...streamEvents],
      conversationId,
      costUsd,
      resultContent,
      durationMs: Date.now() - startTime,
    });

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

    const persistSnapshot = () => {
      if (!options.onPersistSnapshot) {
        return;
      }

      const snapshot = [...streamEvents];
      pendingPersist = options
        .onPersistSnapshot(snapshot)
        .catch((error: unknown) => {
          this.logger.warn('Failed to persist partial Claude stream', {
            containerId: options.containerId,
            error: error instanceof Error ? error.message : String(error),
          });
        })
        .finally(() => {
          pendingPersist = null;
        });
    };

    const handleEvent = (event: any) => {
      streamEvents.push(event);
      notifyEvent(event);

      if (event.type === 'result') {
        conversationId = event.session_id ?? null;
        costUsd = event.cost_usd ?? null;
        resultContent = event.result ?? '';
        finalizeExecution?.();
      }

      const delta = streamEvents.length - lastPersistedCount;
      if (
        options.onPersistSnapshot &&
        persistEveryEvents > 0 &&
        delta >= persistEveryEvents &&
        !pendingPersist
      ) {
        lastPersistedCount = streamEvents.length;
        persistSnapshot();
      }
    };

    const cmd = this.buildClaudeCommand(options);
    const { stream, kill } = await this.dockerEngine.execStreamInContainer(
      options.containerId,
      cmd,
      (chunk: string) => {
        const events = parser.parse(chunk);
        for (const event of events) {
          handleEvent(event);
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

        if (pendingPersist) {
          await pendingPersist.catch(() => {});
        }

        resolve(buildResult());

        kill().catch((error: unknown) => {
          this.logger.warn('Failed to kill Claude exec stream', {
            containerId: options.containerId,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      };

      finalizeExecution = () => {
        void finalize();
      };

      const fail = async (error: Error) => {
        if (completed) {
          return;
        }
        completed = true;

        if (pendingPersist) {
          await pendingPersist.catch(() => {});
        }

        reject(new ClaudeStreamExecutionError(error.message, buildResult()));
      };

      stream.on('end', () => {
        const remaining = parser.flush();
        for (const event of remaining) {
          handleEvent(event);
        }

        void finalize();
      });

      stream.on('error', (error: Error) => {
        if (completed) {
          return;
        }

        void fail(error);
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
