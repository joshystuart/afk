import { EventEmitter2 } from '@nestjs/event-emitter';
import { JOB_RUN_EVENTS } from '../../../libs/scheduled-jobs/job-run-events';
import { ScheduledJobRunEventsService } from './scheduled-job-run-events.service';

describe('ScheduledJobRunEventsService', () => {
  let service: ScheduledJobRunEventsService;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  beforeEach(() => {
    eventEmitter = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<EventEmitter2>;

    service = new ScheduledJobRunEventsService(eventEmitter);
  });

  it('publishes started runs with an immediate updated event', () => {
    service.publishStarted('job-1', 'run-1');

    expect(eventEmitter.emit).toHaveBeenNthCalledWith(
      1,
      JOB_RUN_EVENTS.started,
      {
        jobId: 'job-1',
        runId: 'run-1',
      },
    );
    expect(eventEmitter.emit).toHaveBeenNthCalledWith(
      2,
      JOB_RUN_EVENTS.updated,
      {
        jobId: 'job-1',
        runId: 'run-1',
      },
    );
  });

  it('publishes updated, completed, failed, and stream events', () => {
    service.publishUpdated('job-1', 'run-1');
    service.publishCompleted('job-1', 'run-1');
    service.publishFailed('job-1', 'run-1', 'boom');
    service.publishStream('job-1', 'run-1', { type: 'stdout', chunk: 'hi' });

    expect(eventEmitter.emit).toHaveBeenCalledWith(JOB_RUN_EVENTS.updated, {
      jobId: 'job-1',
      runId: 'run-1',
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(JOB_RUN_EVENTS.completed, {
      jobId: 'job-1',
      runId: 'run-1',
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(JOB_RUN_EVENTS.failed, {
      jobId: 'job-1',
      runId: 'run-1',
      error: 'boom',
    });
    expect(eventEmitter.emit).toHaveBeenCalledWith(JOB_RUN_EVENTS.stream, {
      jobId: 'job-1',
      runId: 'run-1',
      event: { type: 'stdout', chunk: 'hi' },
    });
  });
});
