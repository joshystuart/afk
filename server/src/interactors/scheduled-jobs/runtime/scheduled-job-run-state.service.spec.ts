import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRun } from '../../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunRepository } from '../../../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRunStatus } from '../../../domain/scheduled-jobs/scheduled-job-run-status.enum';
import { ScheduledJobRunStateService } from './scheduled-job-run-state.service';
import { ScheduledJobTimingService } from './scheduled-job-timing.service';

describe('ScheduledJobRunStateService', () => {
  let service: ScheduledJobRunStateService;
  let scheduledJobRepository: jest.Mocked<ScheduledJobRepository>;
  let scheduledJobRunRepository: jest.Mocked<ScheduledJobRunRepository>;
  let scheduledJobTimingService: jest.Mocked<ScheduledJobTimingService>;

  beforeEach(() => {
    scheduledJobRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findEnabled: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRepository>;

    scheduledJobRunRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByJobId: jest.fn(),
      findByJobIdSummaries: jest.fn(),
      findActiveByJobId: jest.fn(),
      findActiveByJobIds: jest.fn(),
      findRecentByJobId: jest.fn(),
      deleteByJobId: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRunRepository>;

    scheduledJobTimingService = {
      calculateNextRunAt: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobTimingService>;

    service = new ScheduledJobRunStateService(
      scheduledJobRepository,
      scheduledJobRunRepository,
      scheduledJobTimingService,
    );
  });

  it('creates a pending run with the default persisted state', async () => {
    const job = Object.assign(new ScheduledJob(), {
      id: 'job-1',
      branch: 'main',
    });

    const run = await service.createPendingRun(job);

    expect(run.id).toEqual(expect.any(String));
    expect(run.jobId).toBe('job-1');
    expect(run.status).toBe(ScheduledJobRunStatus.PENDING);
    expect(run.branch).toBe('main');
    expect(run.committed).toBe(false);
    expect(run.streamEvents).toBeNull();
    expect(scheduledJobRunRepository.save).toHaveBeenCalledWith(run);
  });

  it('marks a run as running and persists the job schedule update', async () => {
    const nextRunAt = new Date('2026-03-23T00:00:00.000Z');
    const job = Object.assign(new ScheduledJob(), {
      id: 'job-1',
      branch: 'main',
      lastRunAt: null,
      nextRunAt: null,
      updatedAt: new Date('2026-03-22T00:00:00.000Z'),
    });
    const run = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
      jobId: 'job-1',
      status: ScheduledJobRunStatus.PENDING,
    });
    scheduledJobTimingService.calculateNextRunAt.mockReturnValue(nextRunAt);

    await service.markRunning(job, run, { scheduledTrigger: true });

    expect(run.status).toBe(ScheduledJobRunStatus.RUNNING);
    expect(run.startedAt).toEqual(expect.any(Date));
    expect(job.lastRunAt).toEqual(run.startedAt);
    expect(job.nextRunAt).toBe(nextRunAt);
    expect(scheduledJobTimingService.calculateNextRunAt).toHaveBeenCalledWith(
      job,
      {
        fromDate: run.startedAt,
      },
    );
    expect(scheduledJobRunRepository.save).toHaveBeenCalledWith(run);
    expect(scheduledJobRepository.save).toHaveBeenCalledWith(job);
  });

  it('applies branch, container, stream, commit, and completion state', async () => {
    const run = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
      jobId: 'job-1',
      status: ScheduledJobRunStatus.RUNNING,
      startedAt: new Date('2026-03-22T00:00:00.000Z'),
    });

    service.setBranch(run, 'feature/auto-fix');
    await service.attachContainer(run, 'container-1');
    service.applyStreamResult(run, {
      streamEventCount: 12,
      streamByteCount: 640,
    });
    service.applyCommitResult(run, {
      committed: true,
      filesChanged: 3,
      commitSha: 'abc123',
    });
    await service.markCompleted(run);

    expect(run.branch).toBe('feature/auto-fix');
    expect(run.containerId).toBe('container-1');
    expect(run.streamEventCount).toBe(12);
    expect(run.streamByteCount).toBe(640);
    expect(run.committed).toBe(true);
    expect(run.filesChanged).toBe(3);
    expect(run.commitSha).toBe('abc123');
    expect(run.status).toBe(ScheduledJobRunStatus.COMPLETED);
    expect(run.completedAt).toEqual(expect.any(Date));
    expect(run.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('returns false when persisting a failed run also fails', async () => {
    const run = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
      jobId: 'job-1',
      status: ScheduledJobRunStatus.RUNNING,
    });
    scheduledJobRunRepository.save.mockRejectedValueOnce(new Error('db down'));

    await expect(service.markFailed(run, 'boom')).resolves.toBe(false);
    expect(run.status).toBe(ScheduledJobRunStatus.FAILED);
    expect(run.errorMessage).toBe('boom');
  });
});
