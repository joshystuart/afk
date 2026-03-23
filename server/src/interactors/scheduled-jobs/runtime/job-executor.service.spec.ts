import { PortPairDto } from '../../../domain/containers/port-pair.dto';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJobRunRepository } from '../../../domain/scheduled-jobs/scheduled-job-run.repository';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { PortManagerService } from '../../../libs/docker/port-manager.service';
import { JobExecutorService } from './job-executor.service';
import { ScheduledJobClaudeGitService } from './scheduled-job-claude-git.service';
import { ScheduledJobRunEventsService } from './scheduled-job-run-events.service';
import { ScheduledJobRuntimeService } from './scheduled-job-runtime.service';
import { ScheduledJobRunStateService } from './scheduled-job-run-state.service';

describe('JobExecutorService', () => {
  let service: JobExecutorService;
  let scheduledJobRepository: jest.Mocked<ScheduledJobRepository>;
  let scheduledJobRunRepository: jest.Mocked<ScheduledJobRunRepository>;
  let dockerEngine: jest.Mocked<DockerEngineService>;
  let portManager: jest.Mocked<PortManagerService>;
  let scheduledJobClaudeGit: jest.Mocked<ScheduledJobClaudeGitService>;
  let scheduledJobRunEvents: jest.Mocked<ScheduledJobRunEventsService>;
  let scheduledJobRuntime: jest.Mocked<ScheduledJobRuntimeService>;
  let scheduledJobRunState: jest.Mocked<ScheduledJobRunStateService>;

  beforeEach(() => {
    scheduledJobRepository = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRepository>;

    scheduledJobRunRepository = {
      findActiveByJobId: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRunRepository>;

    dockerEngine = {
      stopContainer: jest.fn(),
      removeContainer: jest.fn(),
    } as unknown as jest.Mocked<DockerEngineService>;

    portManager = {
      releasePortPair: jest.fn(),
    } as unknown as jest.Mocked<PortManagerService>;

    scheduledJobClaudeGit = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobClaudeGitService>;

    scheduledJobRunEvents = {
      publishStarted: jest.fn(),
      publishUpdated: jest.fn(),
      publishCompleted: jest.fn(),
      publishFailed: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRunEventsService>;

    scheduledJobRuntime = {
      prepare: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRuntimeService>;

    scheduledJobRunState = {
      createPendingRun: jest.fn(),
      markRunning: jest.fn(),
      setBranch: jest.fn(),
      attachContainer: jest.fn(),
      applyStreamResult: jest.fn(),
      applyCommitResult: jest.fn(),
      markCompleted: jest.fn(),
      markFailed: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRunStateService>;

    service = new JobExecutorService(
      scheduledJobRepository,
      scheduledJobRunRepository,
      dockerEngine,
      portManager,
      scheduledJobClaudeGit,
      scheduledJobRunEvents,
      scheduledJobRuntime,
      scheduledJobRunState,
    );
  });

  it('skips execution when an active run already exists', async () => {
    scheduledJobRepository.findById.mockResolvedValue({
      id: 'job-1',
      enabled: true,
    } as any);
    scheduledJobRunRepository.findActiveByJobId.mockResolvedValue({
      id: 'run-active',
    } as any);

    await service.execute('job-1');

    expect(scheduledJobRunState.createPendingRun).not.toHaveBeenCalled();
    expect(scheduledJobRuntime.prepare).not.toHaveBeenCalled();
    expect(scheduledJobClaudeGit.execute).not.toHaveBeenCalled();
  });

  it('executes when there is no active run', async () => {
    const ports = new PortPairDto(3400);
    const run = {
      id: 'run-1',
      containerId: null,
    } as any;

    scheduledJobRepository.findById.mockResolvedValue({
      id: 'job-1',
      enabled: true,
    } as any);
    scheduledJobRunRepository.findActiveByJobId.mockResolvedValue(null);
    scheduledJobRunState.createPendingRun.mockResolvedValue(run);
    scheduledJobRuntime.prepare.mockResolvedValue({
      ports,
      containerId: 'container-1',
      branchName: 'job-1/main',
    });
    scheduledJobRunState.attachContainer.mockImplementation(
      async (targetRun) => {
        targetRun.containerId = 'container-1';
      },
    );
    scheduledJobClaudeGit.execute.mockResolvedValue({
      streamResult: {
        streamEventCount: 1,
        streamByteCount: 12,
      },
      commitResult: null,
    } as any);
    dockerEngine.stopContainer.mockResolvedValue(undefined);
    dockerEngine.removeContainer.mockResolvedValue(undefined);
    portManager.releasePortPair.mockResolvedValue(undefined);

    await service.execute('job-1');

    expect(scheduledJobRunState.createPendingRun).toHaveBeenCalledTimes(1);
    expect(scheduledJobRuntime.prepare).toHaveBeenCalledTimes(1);
    expect(scheduledJobClaudeGit.execute).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'job-1' }),
      run,
      'container-1',
      'job-1/main',
    );
    expect(dockerEngine.stopContainer).toHaveBeenCalledWith('container-1');
    expect(dockerEngine.removeContainer).toHaveBeenCalledWith('container-1');
    expect(portManager.releasePortPair).toHaveBeenCalledWith(ports);
  });
});
