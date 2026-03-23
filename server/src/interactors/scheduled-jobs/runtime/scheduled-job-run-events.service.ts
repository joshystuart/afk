import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { JOB_RUN_EVENTS } from '../../../libs/scheduled-jobs/job-run-events';

@Injectable()
export class ScheduledJobRunEventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  publishStarted(jobId: string, runId: string): void {
    this.eventEmitter.emit(JOB_RUN_EVENTS.started, {
      jobId,
      runId,
    });
    this.publishUpdated(jobId, runId);
  }

  publishUpdated(jobId: string, runId: string): void {
    this.eventEmitter.emit(JOB_RUN_EVENTS.updated, {
      jobId,
      runId,
    });
  }

  publishCompleted(jobId: string, runId: string): void {
    this.eventEmitter.emit(JOB_RUN_EVENTS.completed, {
      jobId,
      runId,
    });
  }

  publishFailed(jobId: string, runId: string, error: string): void {
    this.eventEmitter.emit(JOB_RUN_EVENTS.failed, {
      jobId,
      runId,
      error,
    });
  }

  publishStream(jobId: string, runId: string, event: unknown): void {
    this.eventEmitter.emit(JOB_RUN_EVENTS.stream, {
      jobId,
      runId,
      event,
    });
  }
}
