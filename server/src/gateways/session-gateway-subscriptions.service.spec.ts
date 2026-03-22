import { Session } from '../domain/sessions/session.entity';
import { SessionIdDtoFactory } from '../domain/sessions/session-id-dto.factory';
import { SessionRepository } from '../domain/sessions/session.repository';
import { SessionStatus } from '../domain/sessions/session-status.enum';
import { ContainerLogStreamService } from '../services/docker/container-log-stream.service';
import { GitWatcherService } from '../services/git-watcher/git-watcher.service';
import { SessionSubscriptionService } from './session-subscription.service';
import { SessionGatewaySubscriptionsService } from './session-gateway-subscriptions.service';

describe('SessionGatewaySubscriptionsService', () => {
  const sessionId = '11111111-1111-4111-8111-111111111111';
  const clientId = 'socket-1';
  const sessionIdDto = { toString: () => sessionId } as any;

  let service: SessionGatewaySubscriptionsService;
  let sessionSubscriptionService: jest.Mocked<SessionSubscriptionService>;
  let containerLogStream: jest.Mocked<ContainerLogStreamService>;
  let gitWatcherService: jest.Mocked<GitWatcherService>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let sessionIdFactory: jest.Mocked<SessionIdDtoFactory>;

  const flushPromises = async () => {
    await new Promise((resolve) => setImmediate(resolve));
  };

  beforeEach(() => {
    sessionSubscriptionService = {
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      unsubscribeAll: jest.fn(),
      getSubscribersForSession: jest.fn().mockReturnValue([]),
      getSessionsForClient: jest.fn().mockReturnValue([]),
      getActiveSubscriptions: jest.fn(),
    } as unknown as jest.Mocked<SessionSubscriptionService>;
    containerLogStream = {
      ensureRunningLogStream: jest.fn(),
      addSubscriber: jest.fn(),
      removeSubscriber: jest.fn(),
      removeAllSubscribersForSocket: jest.fn(),
    } as unknown as jest.Mocked<ContainerLogStreamService>;
    gitWatcherService = {
      isWatching: jest.fn().mockReturnValue(false),
      startWatching: jest.fn(),
      stopWatching: jest.fn(),
    } as unknown as jest.Mocked<GitWatcherService>;
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
    sessionIdFactory = {
      fromString: jest.fn().mockReturnValue(sessionIdDto),
      create: jest.fn(),
    } as unknown as jest.Mocked<SessionIdDtoFactory>;

    service = new SessionGatewaySubscriptionsService(
      sessionSubscriptionService,
      containerLogStream,
      gitWatcherService,
      sessionRepository,
      sessionIdFactory,
    );
  });

  it('subscribes to a session, marks activity, and starts the git watcher', async () => {
    const session = Object.assign(new Session(), {
      id: sessionId,
      status: SessionStatus.RUNNING,
      containerId: 'container-1',
      lastAccessedAt: null,
    });
    sessionRepository.findById.mockResolvedValue(session);

    await service.subscribeToSession(clientId, sessionId);
    await flushPromises();

    expect(sessionSubscriptionService.subscribe).toHaveBeenCalledWith(
      clientId,
      sessionId,
    );
    expect(sessionIdFactory.fromString).toHaveBeenCalledWith(sessionId);
    expect(sessionRepository.save).toHaveBeenCalledWith(session);
    expect(session.lastAccessedAt).toBeInstanceOf(Date);
    expect(gitWatcherService.startWatching).toHaveBeenCalledWith(
      sessionId,
      'container-1',
    );
  });

  it('cleans up socket subscriptions and stops orphaned watchers on disconnect', async () => {
    sessionSubscriptionService.getSessionsForClient.mockReturnValue([
      'session-1',
      'session-2',
    ]);
    sessionSubscriptionService.getSubscribersForSession.mockImplementation(
      (id: string) => (id === 'session-1' ? [] : ['socket-2']),
    );

    await service.handleDisconnect(clientId);

    expect(
      containerLogStream.removeAllSubscribersForSocket,
    ).toHaveBeenCalledWith(clientId);
    expect(sessionSubscriptionService.unsubscribeAll).toHaveBeenCalledWith(
      clientId,
    );
    expect(gitWatcherService.stopWatching).toHaveBeenCalledTimes(1);
    expect(gitWatcherService.stopWatching).toHaveBeenCalledWith('session-1');
  });

  it('subscribes a socket to the shared log stream and forwards payloads', async () => {
    const session = Object.assign(new Session(), {
      id: sessionId,
      status: SessionStatus.RUNNING,
      containerId: 'container-1',
    });
    sessionRepository.findById.mockResolvedValue(session);
    const onLog = jest.fn();

    await service.subscribeToLogs(clientId, sessionId, onLog);

    expect(containerLogStream.ensureRunningLogStream).toHaveBeenCalledWith(
      sessionId,
      'container-1',
    );
    expect(containerLogStream.addSubscriber).toHaveBeenCalledWith(
      sessionId,
      'container-1',
      clientId,
      expect.any(Function),
    );

    const [, , , forwardedLog] = containerLogStream.addSubscriber.mock.calls[0];
    forwardedLog('hello world');

    expect(onLog).toHaveBeenCalledWith({
      sessionId,
      log: 'hello world',
      timestamp: expect.any(String),
    });
  });

  it('rejects log subscriptions when the session has no container', async () => {
    sessionRepository.findById.mockResolvedValue(
      Object.assign(new Session(), {
        id: sessionId,
        status: SessionStatus.STOPPED,
        containerId: null,
      }),
    );

    await expect(
      service.subscribeToLogs(clientId, sessionId, jest.fn()),
    ).rejects.toThrow('No container found for session');
  });
});
