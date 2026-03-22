import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ScheduledJobRepository } from '../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRunRepository } from '../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRunStatus } from '../domain/scheduled-jobs/scheduled-job-run-status.enum';
import { ScheduledJobGatewayResponseFactory } from './scheduled-job-gateway-response.factory';
import { getJobRunRoom, SOCKET_EVENTS } from './session-gateway.events';

export interface JobRunSubscriptionPayload {
  runId: string;
}

export interface JobRunStreamPayload {
  jobId: string;
  runId: string;
  event: unknown;
}

export interface JobRunUpdatedPayload {
  jobId: string;
  runId: string;
}

@Injectable()
export class SessionGatewayJobRunsService {
  constructor(
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
    private readonly scheduledJobGatewayResponseFactory: ScheduledJobGatewayResponseFactory,
  ) {}

  async handleJobRunSubscription(
    client: Socket,
    data: JobRunSubscriptionPayload,
  ) {
    const run = await this.scheduledJobRunRepository.findById(data.runId);
    if (!run) {
      return {
        event: SOCKET_EVENTS.jobRunError,
        data: { runId: data.runId, error: 'Scheduled job run not found' },
      };
    }

    client.emit(SOCKET_EVENTS.jobRunUpdated, {
      run: this.scheduledJobGatewayResponseFactory.createRun(run),
      timestamp: this.nowIso(),
    });

    if (run.status !== ScheduledJobRunStatus.RUNNING) {
      return {
        event: SOCKET_EVENTS.jobRunSubscribed,
        data: { runId: data.runId, active: false },
      };
    }

    await client.join(getJobRunRoom(data.runId));

    return {
      event: SOCKET_EVENTS.jobRunSubscribed,
      data: { runId: data.runId, active: true },
    };
  }

  async handleJobRunUnsubscription(
    client: Socket,
    data: JobRunSubscriptionPayload,
  ) {
    await client.leave(getJobRunRoom(data.runId));

    return {
      event: SOCKET_EVENTS.jobRunUnsubscribed,
      data: { runId: data.runId },
    };
  }

  handleJobRunStream(server: Server, payload: JobRunStreamPayload): void {
    server.to(getJobRunRoom(payload.runId)).emit(SOCKET_EVENTS.jobRunStream, {
      jobId: payload.jobId,
      runId: payload.runId,
      event: payload.event,
      timestamp: this.nowIso(),
    });
  }

  async handleScheduledJobRunUpdated(
    server: Server,
    payload: JobRunUpdatedPayload,
  ): Promise<void> {
    const [job, run] = await Promise.all([
      this.scheduledJobRepository.findById(payload.jobId),
      this.scheduledJobRunRepository.findById(payload.runId),
    ]);

    if (run) {
      const runResponse =
        this.scheduledJobGatewayResponseFactory.createRun(run);

      server
        .to(getJobRunRoom(payload.runId))
        .emit(SOCKET_EVENTS.jobRunUpdated, {
          run: runResponse,
          timestamp: this.nowIso(),
        });

      server.emit(SOCKET_EVENTS.scheduledJobRunUpdated, {
        run: runResponse,
        timestamp: this.nowIso(),
      });
    }

    if (!job) {
      return;
    }

    const jobResponse =
      await this.scheduledJobGatewayResponseFactory.createJob(job);

    server.emit(SOCKET_EVENTS.scheduledJobUpdated, {
      job: jobResponse,
      timestamp: this.nowIso(),
    });
  }

  private nowIso(): string {
    return new Date().toISOString();
  }
}
