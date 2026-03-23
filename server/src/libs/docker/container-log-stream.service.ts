import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { DockerEngineService } from './docker-engine.service';

interface TrackedStreamState {
  readonly sessionId: string;
  readonly containerId: string;
  stream: NodeJS.ReadableStream;
  readonly subscribers: Map<string, (log: string) => void>;
  readonly startedAt: number;
  bytesSeen: number;
  lastActivityAt: number;
}

/**
 * Owns all long-lived `container.logs({ follow: true })` streams for session
 * containers. At most one Docker follower per session; websocket clients attach
 * as subscribers instead of opening their own streams.
 */
@Injectable()
export class ContainerLogStreamService implements OnModuleDestroy {
  private readonly logger = new Logger(ContainerLogStreamService.name);
  private readonly streams = new Map<string, TrackedStreamState>();
  private readonly socketLogSession = new Map<string, string>();

  constructor(private readonly dockerEngine: DockerEngineService) {}

  async ensureRunningLogStream(
    sessionId: string,
    containerId: string,
  ): Promise<void> {
    const existing = this.streams.get(sessionId);
    if (existing && existing.containerId === containerId) {
      return;
    }
    if (existing) {
      await this.teardownStream(sessionId, existing);
    }

    const stream =
      await this.dockerEngine.openContainerFollowLogStream(containerId);

    const state: TrackedStreamState = {
      sessionId,
      containerId,
      stream,
      subscribers: new Map(),
      startedAt: Date.now(),
      bytesSeen: 0,
      lastActivityAt: Date.now(),
    };

    stream.on('data', (chunk: Buffer | string) => {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      state.bytesSeen += buf.length;
      state.lastActivityAt = Date.now();
      const text = buf.toString();
      this.logger.debug(`Container ${sessionId}`, text);
      for (const forward of state.subscribers.values()) {
        forward(text);
      }
    });

    stream.on('error', (err: unknown) => {
      this.logger.debug(`Container ${sessionId} - Log stream error`, err);
    });

    stream.on('end', () => {
      this.logger.debug(`Container ${sessionId} - Log stream ended.`);
      const current = this.streams.get(sessionId);
      if (current?.stream === stream) {
        this.streams.delete(sessionId);
      }
    });

    this.streams.set(sessionId, state);
  }

  addSubscriber(
    sessionId: string,
    containerId: string,
    socketId: string,
    onLog: (log: string) => void,
  ): void {
    const prevSessionId = this.socketLogSession.get(socketId);
    if (prevSessionId && prevSessionId !== sessionId) {
      this.removeSubscriberFromSession(prevSessionId, socketId);
    }

    const state = this.streams.get(sessionId);
    if (!state || state.containerId !== containerId) {
      throw new Error('Log stream not available for this session');
    }

    state.subscribers.set(socketId, onLog);
    this.socketLogSession.set(socketId, sessionId);
  }

  removeSubscriber(socketId: string): void {
    const sessionId = this.socketLogSession.get(socketId);
    if (sessionId) {
      this.removeSubscriberFromSession(sessionId, socketId);
    }
  }

  removeAllSubscribersForSocket(socketId: string): void {
    this.removeSubscriber(socketId);
  }

  private removeSubscriberFromSession(
    sessionId: string,
    socketId: string,
  ): void {
    const state = this.streams.get(sessionId);
    state?.subscribers.delete(socketId);
    if (this.socketLogSession.get(socketId) === sessionId) {
      this.socketLogSession.delete(socketId);
    }
  }

  async releaseSession(sessionId: string): Promise<void> {
    const state = this.streams.get(sessionId);
    if (!state) {
      return;
    }
    await this.teardownStream(sessionId, state);
  }

  async onModuleDestroy(): Promise<void> {
    await this.releaseAll();
  }

  async releaseAll(): Promise<void> {
    const ids = [...this.streams.keys()];
    for (const sessionId of ids) {
      await this.releaseSession(sessionId);
    }
  }

  private async teardownStream(
    sessionId: string,
    state: TrackedStreamState,
  ): Promise<void> {
    if (this.streams.get(sessionId) === state) {
      this.streams.delete(sessionId);
    }

    for (const socketId of state.subscribers.keys()) {
      if (this.socketLogSession.get(socketId) === sessionId) {
        this.socketLogSession.delete(socketId);
      }
    }
    state.subscribers.clear();

    this.destroyDockerStream(state.stream);
  }

  getMetrics(): {
    activeStreams: number;
    totalSubscribers: number;
    streams: Array<{
      sessionId: string;
      containerId: string;
      subscriberCount: number;
      bytesSeen: number;
      startedAt: number;
      lastActivityAt: number;
    }>;
  } {
    const streams: Array<{
      sessionId: string;
      containerId: string;
      subscriberCount: number;
      bytesSeen: number;
      startedAt: number;
      lastActivityAt: number;
    }> = [];
    let totalSubscribers = 0;

    for (const state of this.streams.values()) {
      totalSubscribers += state.subscribers.size;
      streams.push({
        sessionId: state.sessionId,
        containerId: state.containerId,
        subscriberCount: state.subscribers.size,
        bytesSeen: state.bytesSeen,
        startedAt: state.startedAt,
        lastActivityAt: state.lastActivityAt,
      });
    }

    return {
      activeStreams: this.streams.size,
      totalSubscribers,
      streams,
    };
  }

  private destroyDockerStream(stream: NodeJS.ReadableStream): void {
    const s = stream as NodeJS.ReadableStream & {
      destroy?: (error?: Error) => void;
    };
    try {
      if (typeof s.destroy === 'function') {
        s.destroy();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn('Error destroying Docker log stream', { message });
    }
  }
}
