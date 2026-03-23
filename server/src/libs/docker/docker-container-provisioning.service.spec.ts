import { PortPairDto } from '../../domain/containers/port-pair.dto';
import { DockerClientService } from './docker-client.service';
import { DockerContainerProvisioningService } from './docker-container-provisioning.service';
import { DockerImageRuntimeService } from './docker-image-runtime.service';

describe('DockerContainerProvisioningService', () => {
  let service: DockerContainerProvisioningService;
  let dockerClient: jest.Mocked<DockerClientService>;
  let dockerImageRuntime: jest.Mocked<DockerImageRuntimeService>;

  beforeEach(() => {
    dockerClient = {
      getClient: jest.fn(),
    } as unknown as jest.Mocked<DockerClientService>;

    dockerImageRuntime = {
      ensureImageAvailable: jest.fn(),
    } as unknown as jest.Mocked<DockerImageRuntimeService>;

    service = new DockerContainerProvisioningService(
      dockerClient,
      dockerImageRuntime,
    );
  });

  it('creates a session container with the expected env and bind mounts', async () => {
    const container = {
      id: 'container-1',
      start: jest.fn().mockResolvedValue(undefined),
    };
    const docker = {
      createContainer: jest.fn().mockResolvedValue(container),
    };

    dockerClient.getClient.mockResolvedValue(docker as any);

    await service.createContainer({
      sessionId: 'session-1',
      sessionName: 'Workspace Session',
      imageName: 'ghcr.io/acme/workspace:latest',
      repoUrl: 'https://github.com/acme/repo.git',
      branch: 'main',
      gitUserName: 'AFK Bot',
      gitUserEmail: 'bot@afk.local',
      sshPrivateKey: 'ssh-key',
      claudeToken: 'claude-token',
      githubToken: 'gh-token',
      hostMountPath: '/tmp/repo',
      ports: new PortPairDto(3100),
    });

    expect(dockerImageRuntime.ensureImageAvailable).toHaveBeenCalledWith(
      'ghcr.io/acme/workspace:latest',
    );
    expect(docker.createContainer).toHaveBeenCalledTimes(1);
    expect(container.start).toHaveBeenCalledTimes(1);

    const createOptions = docker.createContainer.mock.calls[0][0];
    expect(createOptions.Env).toEqual(
      expect.arrayContaining([
        'REPO_URL=https://github.com/acme/repo.git',
        'REPO_BRANCH=main',
        'GIT_USER_NAME=AFK Bot',
        'GIT_USER_EMAIL=bot@afk.local',
        'TERMINAL_PORT=3100',
        'SESSION_NAME=Workspace Session',
        'IMAGE_NAME=ghcr.io/acme/workspace:latest',
        'SSH_PRIVATE_KEY=ssh-key',
        'CLAUDE_CODE_OAUTH_TOKEN=claude-token',
        'GITHUB_TOKEN=gh-token',
      ]),
    );
    expect(createOptions.HostConfig.Binds).toEqual(
      expect.arrayContaining([
        'afk-tmux-session-1:/home/afk/.tmux/resurrect',
        'afk-claude-session-1:/home/afk/.claude',
        '/tmp/repo:/workspace/repo:rw',
      ]),
    );
    expect(createOptions.Labels).toEqual({
      'afk.session.id': 'session-1',
      'afk.session.name': 'Workspace Session',
      'afk.managed': 'true',
    });
  });

  it('creates an ephemeral container with job labels and derived session name', async () => {
    const container = {
      id: 'container-2',
      start: jest.fn().mockResolvedValue(undefined),
    };
    const docker = {
      createContainer: jest.fn().mockResolvedValue(container),
    };

    dockerClient.getClient.mockResolvedValue(docker as any);

    await service.createEphemeralContainer({
      jobId: 'job-1',
      runId: 'run-12345678-abcdef',
      imageName: 'ghcr.io/acme/job:latest',
      repoUrl: 'https://github.com/acme/repo.git',
      branch: 'feature/refactor',
      gitUserName: 'AFK Bot',
      gitUserEmail: 'bot@afk.local',
      ports: new PortPairDto(3200),
    });

    const createOptions = docker.createContainer.mock.calls[0][0];
    expect(createOptions.Env).toEqual(
      expect.arrayContaining([
        'SESSION_NAME=job-run-1234',
        'REPO_BRANCH=feature/refactor',
      ]),
    );
    expect(createOptions.Labels).toEqual({
      'afk.job.id': 'job-1',
      'afk.job.run.id': 'run-12345678-abcdef',
      'afk.managed': 'true',
    });
    expect(createOptions.HostConfig.RestartPolicy).toEqual({ Name: 'no' });
  });
});
