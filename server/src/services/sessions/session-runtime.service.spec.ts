import { Session } from '../../domain/sessions/session.entity';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../domain/sessions/session.repository';
import { SessionStatus } from '../../domain/sessions/session-status.enum';
import { ContainerLogStreamService } from '../docker/container-log-stream.service';
import { DockerEngineService } from '../docker/docker-engine.service';
import { GitWatcherService } from '../git-watcher/git-watcher.service';
import { SessionRuntimeService } from './session-runtime.service';

describe('SessionRuntimeService', () => {
  const sessionId = '11111111-1111-4111-8111-111111111111';

  let service: SessionRuntimeService;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let dockerEngine: jest.Mocked<DockerEngineService>;
  let containerLogStream: jest.Mocked<ContainerLogStreamService>;
  let gitWatcherService: jest.Mocked<GitWatcherService>;

  beforeEach(() => {
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
    dockerEngine = {
      stopContainer: jest.fn(),
    } as unknown as jest.Mocked<DockerEngineService>;
    containerLogStream = {
      releaseSession: jest.fn(),
    } as unknown as jest.Mocked<ContainerLogStreamService>;
    gitWatcherService = {
      stopWatching: jest.fn(),
    } as unknown as jest.Mocked<GitWatcherService>;

    service = new SessionRuntimeService(
      dockerEngine,
      containerLogStream,
      sessionRepository,
      gitWatcherService,
    );
  });

  it('stops a running session and persists the status change', async () => {
    const session = Object.assign(new Session(), {
      id: sessionId,
      status: SessionStatus.RUNNING,
      containerId: 'container-1',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    sessionRepository.findById.mockResolvedValue(session);

    await service.stopSession(new SessionIdDto(sessionId));

    expect(gitWatcherService.stopWatching).toHaveBeenCalledWith(sessionId);
    expect(containerLogStream.releaseSession).toHaveBeenCalledWith(sessionId);
    expect(dockerEngine.stopContainer).toHaveBeenCalledWith('container-1');
    expect(session.status).toBe(SessionStatus.STOPPED);
    expect(sessionRepository.save).toHaveBeenCalledWith(session);
  });

  it('rejects missing sessions', async () => {
    sessionRepository.findById.mockResolvedValue(null);

    await expect(
      service.stopSession(new SessionIdDto(sessionId)),
    ).rejects.toThrow('Session not found');
  });

  it('rejects sessions that are not running', async () => {
    const session = Object.assign(new Session(), {
      id: sessionId,
      status: SessionStatus.STOPPED,
      containerId: 'container-1',
    });
    sessionRepository.findById.mockResolvedValue(session);

    await expect(
      service.stopSession(new SessionIdDto(sessionId)),
    ).rejects.toThrow('Session is not running');
  });
});
