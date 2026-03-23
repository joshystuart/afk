import { ScheduledJob } from '../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRun } from '../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunRepository } from '../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduledJobRunStatus } from '../domain/scheduled-jobs/scheduled-job-run-status.enum';
import { ScheduleType } from '../domain/scheduled-jobs/schedule-type.enum';
import { ScheduledJobGatewayResponseFactory } from './scheduled-job-gateway-response.factory';

describe('ScheduledJobGatewayResponseFactory', () => {
  let factory: ScheduledJobGatewayResponseFactory;
  let scheduledJobRunRepository: jest.Mocked<ScheduledJobRunRepository>;

  beforeEach(() => {
    scheduledJobRunRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByJobId: jest.fn(),
      findByJobIdSummaries: jest.fn(),
      findRecentByJobId: jest.fn(),
      findActiveByJobId: jest.fn(),
      findActiveByJobIds: jest.fn(),
      deleteByJobId: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRunRepository>;

    factory = new ScheduledJobGatewayResponseFactory(scheduledJobRunRepository);
  });

  it('maps scheduled jobs with the active run summary', async () => {
    const now = new Date('2026-02-03T04:05:06.000Z');
    const activeRun = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
      jobId: 'job-1',
      status: ScheduledJobRunStatus.RUNNING,
      branch: 'feature/test',
      createdAt: now,
      startedAt: now,
    });
    const job = Object.assign(new ScheduledJob(), {
      id: 'job-1',
      name: 'Nightly update',
      repoUrl: 'https://github.com/acme/repo',
      branch: 'main',
      createNewBranch: true,
      newBranchPrefix: 'afk',
      imageId: 'image-1',
      prompt: 'Apply updates',
      model: 'sonnet',
      scheduleType: ScheduleType.CRON,
      cronExpression: '0 0 * * *',
      intervalMs: null,
      commitAndPush: true,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      lastRunAt: now,
      nextRunAt: now,
    });
    scheduledJobRunRepository.findActiveByJobId.mockResolvedValue(activeRun);

    const response = await factory.createJob(job);

    expect(response.currentRun).toEqual({
      id: 'run-1',
      jobId: 'job-1',
      status: ScheduledJobRunStatus.RUNNING,
      branch: 'feature/test',
      startedAt: now.toISOString(),
      createdAt: now.toISOString(),
    });
    expect(response.scheduleType).toBe(ScheduleType.CRON);
    expect(response.lastRunAt).toBe(now.toISOString());
    expect(response.nextRunAt).toBe(now.toISOString());
  });

  it('maps full run payloads for websocket updates', () => {
    const now = new Date('2026-02-03T04:05:06.000Z');
    const run = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
      jobId: 'job-1',
      status: ScheduledJobRunStatus.COMPLETED,
      branch: 'feature/test',
      containerId: 'container-1',
      streamEventCount: 12,
      streamByteCount: 2048,
      committed: true,
      filesChanged: 3,
      commitSha: 'abc123',
      durationMs: 5000,
      createdAt: now,
      startedAt: now,
      completedAt: now,
    });

    expect(factory.createRun(run)).toEqual({
      id: 'run-1',
      jobId: 'job-1',
      status: ScheduledJobRunStatus.COMPLETED,
      branch: 'feature/test',
      containerId: 'container-1',
      streamEventCount: 12,
      streamByteCount: 2048,
      errorMessage: undefined,
      committed: true,
      filesChanged: 3,
      commitSha: 'abc123',
      durationMs: 5000,
      startedAt: now.toISOString(),
      completedAt: now.toISOString(),
      createdAt: now.toISOString(),
    });
  });
});
