import { PortPairDto } from '../../../domain/containers/port-pair.dto';
import { DockerImageRepository } from '../../../domain/docker-images/docker-image.repository';
import { DockerImageStatus } from '../../../domain/docker-images/docker-image-status.enum';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRun } from '../../../domain/scheduled-jobs/scheduled-job-run.entity';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { PortManagerService } from '../../../libs/docker/port-manager.service';
import { ScheduledJobRuntimeService } from './scheduled-job-runtime.service';

describe('ScheduledJobRuntimeService', () => {
  let service: ScheduledJobRuntimeService;
  let dockerEngine: jest.Mocked<DockerEngineService>;
  let portManager: jest.Mocked<PortManagerService>;
  let dockerImageRepository: jest.Mocked<DockerImageRepository>;
  let settingsRepository: jest.Mocked<SettingsRepository>;

  beforeEach(() => {
    dockerEngine = {
      waitForDockerReady: jest.fn(),
      createEphemeralContainer: jest.fn(),
      waitForContainerReady: jest.fn(),
      removeContainer: jest.fn(),
    } as unknown as jest.Mocked<DockerEngineService>;

    portManager = {
      allocatePortPair: jest.fn(),
      releasePortPair: jest.fn(),
    } as unknown as jest.Mocked<PortManagerService>;

    dockerImageRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<DockerImageRepository>;

    settingsRepository = {
      get: jest.fn(),
      save: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<SettingsRepository>;

    service = new ScheduledJobRuntimeService(
      dockerEngine,
      portManager,
      dockerImageRepository,
      settingsRepository,
    );

    dockerEngine.waitForDockerReady.mockResolvedValue(undefined);
    dockerEngine.waitForContainerReady.mockResolvedValue(undefined);
    dockerEngine.removeContainer.mockResolvedValue(undefined);
    portManager.releasePortPair.mockResolvedValue(undefined);
  });

  it('prepares runtime state for a scheduled job run', async () => {
    const ports = new PortPairDto(3100);
    const job = Object.assign(new ScheduledJob(), {
      id: 'job-1',
      branch: 'main',
      repoUrl: 'https://github.com/acme/repo',
      imageId: 'image-1',
      createNewBranch: false,
      newBranchPrefix: null,
    });
    const run = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
    });

    dockerImageRepository.findById.mockResolvedValue({
      id: 'image-1',
      image: 'ghcr.io/acme/job-image:latest',
      name: 'job-image',
      status: DockerImageStatus.AVAILABLE,
    } as any);
    portManager.allocatePortPair.mockResolvedValue(ports);
    settingsRepository.get.mockResolvedValue({
      git: {
        userName: 'AFK Bot',
        userEmail: 'bot@afk.local',
        sshPrivateKey: 'ssh-key',
        githubAccessToken: 'gh-token',
      },
      general: {
        claudeToken: 'claude-token',
      },
    } as any);
    dockerEngine.createEphemeralContainer.mockResolvedValue({
      id: 'container-1',
    } as any);

    const runtime = await service.prepare(job, run);

    expect(runtime).toEqual({
      branchName: 'main',
      containerId: 'container-1',
      ports,
    });
    expect(dockerEngine.waitForDockerReady).toHaveBeenCalledTimes(1);
    expect(dockerEngine.createEphemeralContainer).toHaveBeenCalledWith({
      jobId: 'job-1',
      runId: 'run-1',
      imageName: 'ghcr.io/acme/job-image:latest',
      repoUrl: 'https://github.com/acme/repo',
      branch: 'main',
      gitUserName: 'AFK Bot',
      gitUserEmail: 'bot@afk.local',
      sshPrivateKey: 'ssh-key',
      ports,
      claudeToken: 'claude-token',
      githubToken: 'gh-token',
    });
    expect(dockerEngine.waitForContainerReady).toHaveBeenCalledWith(
      'container-1',
    );
  });

  it('releases allocated ports when provisioning fails', async () => {
    const ports = new PortPairDto(3200);
    const job = Object.assign(new ScheduledJob(), {
      id: 'job-1',
      branch: 'main',
      repoUrl: 'git@github.com:acme/repo.git',
      imageId: 'image-1',
      createNewBranch: false,
      newBranchPrefix: null,
    });
    const run = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
    });

    dockerImageRepository.findById.mockResolvedValue({
      id: 'image-1',
      image: 'ghcr.io/acme/job-image:latest',
      name: 'job-image',
      status: DockerImageStatus.AVAILABLE,
    } as any);
    portManager.allocatePortPair.mockResolvedValue(ports);
    settingsRepository.get.mockResolvedValue({
      git: {
        userName: 'AFK Bot',
        userEmail: 'bot@afk.local',
        sshPrivateKey: 'ssh-key',
        githubAccessToken: 'gh-token',
      },
      general: {
        claudeToken: 'claude-token',
      },
    } as any);
    settingsRepository.get.mockRejectedValueOnce(new Error('settings failed'));

    await expect(service.prepare(job, run)).rejects.toThrow('settings failed');
    expect(portManager.releasePortPair).toHaveBeenCalledWith(ports);
  });
});
