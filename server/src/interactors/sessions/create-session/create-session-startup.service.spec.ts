import { DockerImageStatus } from '../../../domain/docker-images/docker-image-status.enum';
import { DockerImageRepository } from '../../../domain/docker-images/docker-image.repository';
import { PortPairDto } from '../../../domain/containers/port-pair.dto';
import { SessionConfigDto } from '../../../domain/sessions/session-config.dto';
import { Session } from '../../../domain/sessions/session.entity';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';
import { ContainerLogStreamService } from '../../../libs/docker/container-log-stream.service';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { PortManagerService } from '../../../libs/docker/port-manager.service';
import { CreateSessionStartupService } from './create-session-startup.service';
import { SessionHealthMonitorService } from '../session-health-monitor.service';

describe('CreateSessionStartupService', () => {
  let service: CreateSessionStartupService;
  let dockerEngine: jest.Mocked<DockerEngineService>;
  let containerLogStream: jest.Mocked<ContainerLogStreamService>;
  let portManager: jest.Mocked<PortManagerService>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let dockerImageRepository: jest.Mocked<DockerImageRepository>;
  let sessionHealthMonitor: jest.Mocked<SessionHealthMonitorService>;

  beforeEach(() => {
    dockerEngine = {
      createContainer: jest.fn(),
      removeContainer: jest.fn(),
    } as unknown as jest.Mocked<DockerEngineService>;

    containerLogStream = {
      ensureRunningLogStream: jest.fn(),
      releaseSession: jest.fn(),
    } as unknown as jest.Mocked<ContainerLogStreamService>;

    portManager = {
      allocatePortPair: jest.fn(),
      releasePortPair: jest.fn(),
    } as unknown as jest.Mocked<PortManagerService>;

    sessionRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn(),
      count: jest.fn(),
      findByContainerId: jest.fn(),
      findExpiredSessions: jest.fn(),
    };

    dockerImageRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findDefault: jest.fn(),
      findByImage: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      clearDefault: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<DockerImageRepository>;

    sessionHealthMonitor = {
      performBackgroundHealthCheck: jest.fn(),
    } as unknown as jest.Mocked<SessionHealthMonitorService>;

    service = new CreateSessionStartupService(
      dockerEngine,
      containerLogStream,
      portManager,
      sessionRepository,
      dockerImageRepository,
      sessionHealthMonitor,
    );
  });

  it('provisions a session container and starts background monitoring', async () => {
    const session = createSession();
    const ports = new PortPairDto(3100);

    portManager.allocatePortPair.mockResolvedValue(ports);
    dockerImageRepository.findById.mockResolvedValue({
      id: 'image-1',
      image: 'ghcr.io/acme/session:latest',
      name: 'session-image',
      status: DockerImageStatus.AVAILABLE,
    } as any);
    dockerEngine.createContainer.mockResolvedValue({
      id: 'container-1',
    } as any);

    const created = await service.start(
      {
        imageId: 'image-1',
      },
      session,
      {
        git: {
          sshPrivateKey: 'ssh-key',
          githubAccessToken: 'gh-token',
        },
        general: {
          claudeToken: 'claude-token',
        },
      } as any,
    );

    expect(created).toBe(session);
    expect(dockerEngine.createContainer).toHaveBeenCalledWith({
      sessionId: session.id,
      sessionName: session.name,
      imageName: 'ghcr.io/acme/session:latest',
      repoUrl: 'https://github.com/acme/repo',
      branch: 'main',
      gitUserName: 'AFK Bot',
      gitUserEmail: 'bot@afk.local',
      sshPrivateKey: 'ssh-key',
      ports,
      claudeToken: 'claude-token',
      githubToken: 'gh-token',
      hostMountPath: '/tmp/workspace',
    });
    expect(containerLogStream.ensureRunningLogStream).toHaveBeenCalledWith(
      session.id,
      'container-1',
    );
    expect(session.status).toBe(SessionStatus.RUNNING);
    expect(sessionRepository.save).toHaveBeenCalledTimes(2);
    expect(
      sessionHealthMonitor.performBackgroundHealthCheck,
    ).toHaveBeenCalledWith(session);
  });

  it('releases resources and marks the session as errored when provisioning fails', async () => {
    const session = createSession();
    const ports = new PortPairDto(3200);
    session.assignContainer('container-1', ports);

    dockerImageRepository.findById.mockResolvedValue({
      id: 'image-1',
      image: 'ghcr.io/acme/session:latest',
      name: 'session-image',
      status: DockerImageStatus.AVAILABLE,
    } as any);
    portManager.allocatePortPair.mockRejectedValue(
      new Error('port allocation failed'),
    );
    containerLogStream.releaseSession.mockResolvedValue(undefined);
    dockerEngine.removeContainer.mockResolvedValue(undefined);

    await expect(
      service.start(
        {
          imageId: 'image-1',
        },
        session,
        {
          git: {
            sshPrivateKey: 'ssh-key',
            githubAccessToken: null,
          },
          general: {
            claudeToken: 'claude-token',
          },
        } as any,
      ),
    ).rejects.toThrow('Session creation failed: port allocation failed');

    expect(portManager.releasePortPair).toHaveBeenCalledWith(ports);
    expect(containerLogStream.releaseSession).toHaveBeenCalledWith(session.id);
    expect(dockerEngine.removeContainer).toHaveBeenCalledWith('container-1');
    expect(session.status).toBe(SessionStatus.ERROR);
    expect(sessionRepository.save).toHaveBeenCalledWith(session);
  });
});

function createSession(): Session {
  return new Session(
    '11111111-1111-4111-8111-111111111111',
    'repo/main',
    new SessionConfigDto(
      'https://github.com/acme/repo',
      'main',
      'AFK Bot',
      'bot@afk.local',
      true,
      '/tmp/workspace',
    ),
    SessionStatus.INITIALIZING,
    null,
    null,
    new Date('2026-01-01T00:00:00.000Z'),
    new Date('2026-01-01T00:00:00.000Z'),
    null,
  );
}
