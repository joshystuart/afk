import * as fs from 'fs';
import * as path from 'path';
import { SessionConfigDtoFactory } from '../../../domain/sessions/session-config-dto.factory';
import { Session } from '../../../domain/sessions/session.entity';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import { SessionConfig } from '../../../libs/config/session.config';
import { MountPathValidator } from '../../../libs/validators/mount-path.validator';
import { CreateSessionRequestService } from './create-session-request.service';

describe('CreateSessionRequestService', () => {
  let service: CreateSessionRequestService;
  let settingsRepository: jest.Mocked<SettingsRepository>;
  let sessionRepository: jest.Mocked<SessionRepository>;
  let tempDirectories: string[];

  beforeEach(() => {
    settingsRepository = {
      get: jest.fn(),
      save: jest.fn(),
      reset: jest.fn(),
    } as unknown as jest.Mocked<SettingsRepository>;

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

    const sessionConfig = new SessionConfig();
    Object.assign(sessionConfig, { maxSessionsPerUser: 3 });

    service = new CreateSessionRequestService(
      settingsRepository,
      sessionRepository,
      new SessionConfigDtoFactory(),
      sessionConfig,
      new MountPathValidator(),
    );

    tempDirectories = [];
  });

  afterEach(() => {
    for (const dir of tempDirectories) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('allows prepare without repo URL when no GitHub token or SSH key is configured', async () => {
    settingsRepository.get.mockResolvedValue({
      git: {
        userName: 'AFK Bot',
        userEmail: 'bot@afk.local',
        sshPrivateKey: '',
        githubAccessToken: null,
      },
      general: {
        claudeToken: 'claude-token',
        defaultMountDirectory: null,
      },
    } as any);
    sessionRepository.findAll.mockResolvedValue([]);

    const prepared = await service.prepare({
      imageId: '11111111-1111-4111-8111-111111111111',
      mountToHost: false,
    });

    expect(prepared.sessionConfig.repoUrl).toBeNull();
    expect(prepared.sessionName).toMatch(/^session-\d+$/);
  });

  it('prepares a session name and config from request defaults', async () => {
    settingsRepository.get.mockResolvedValue({
      git: {
        userName: 'AFK Bot',
        userEmail: 'bot@afk.local',
        sshPrivateKey: 'ssh-key',
        githubAccessToken: 'gh-token',
      },
      general: {
        claudeToken: 'claude-token',
        defaultMountDirectory: null,
      },
    } as any);
    sessionRepository.findAll.mockResolvedValue([]);

    const prepared = await service.prepare({
      imageId: '11111111-1111-4111-8111-111111111111',
      repoUrl: 'https://github.com/acme/repo.git',
      branch: 'feature/refactor',
      mountToHost: false,
    });

    expect(prepared.sessionName).toBe('repo/feature/refactor');
    expect(prepared.sessionConfig.repoUrl).toBe(
      'https://github.com/acme/repo.git',
    );
    expect(prepared.sessionConfig.branch).toBe('feature/refactor');
    expect(prepared.sessionConfig.gitUserName).toBe('AFK Bot');
    expect(prepared.sessionConfig.gitUserEmail).toBe('bot@afk.local');
    expect(prepared.sessionConfig.hasSSHKey).toBe(true);
    expect(prepared.sessionConfig.hostMountPath).toBeNull();
  });

  it('creates and validates a host mount path when mount-to-host is enabled', async () => {
    const mountRoot = fs.mkdtempSync(
      path.join(process.cwd(), '.tmp-create-session-'),
    );
    const hostMountPath = path.join(mountRoot, 'nested', 'workspace');
    tempDirectories.push(mountRoot);

    settingsRepository.get.mockResolvedValue({
      git: {
        userName: 'AFK Bot',
        userEmail: 'bot@afk.local',
        sshPrivateKey: 'ssh-key',
        githubAccessToken: null,
      },
      general: {
        claudeToken: 'claude-token',
        defaultMountDirectory: null,
      },
    } as any);
    sessionRepository.findAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const prepared = await service.prepare({
      imageId: '11111111-1111-4111-8111-111111111111',
      repoUrl: 'git@github.com:acme/repo.git',
      hostMountPath,
      mountToHost: true,
    });

    expect(prepared.sessionConfig.hostMountPath).toBe(hostMountPath);
    expect(fs.existsSync(hostMountPath)).toBe(true);
  });

  it('rejects mount paths already used by active sessions', async () => {
    const mountRoot = fs.mkdtempSync(
      path.join(process.cwd(), '.tmp-create-session-'),
    );
    const hostMountPath = path.join(mountRoot, 'nested', 'workspace');
    tempDirectories.push(mountRoot);

    settingsRepository.get.mockResolvedValue({
      git: {
        userName: 'AFK Bot',
        userEmail: 'bot@afk.local',
        sshPrivateKey: 'ssh-key',
        githubAccessToken: null,
      },
      general: {
        claudeToken: 'claude-token',
        defaultMountDirectory: null,
      },
    } as any);
    sessionRepository.findAll.mockResolvedValueOnce([]).mockResolvedValueOnce([
      Object.assign(new Session(), {
        name: 'existing-session',
        status: SessionStatus.RUNNING,
        config: {
          hostMountPath,
        },
      }),
    ]);

    await expect(
      service.prepare({
        imageId: '11111111-1111-4111-8111-111111111111',
        repoUrl: 'git@github.com:acme/repo.git',
        hostMountPath,
        mountToHost: true,
      }),
    ).rejects.toThrow(
      `Mount path '${hostMountPath}' is already in use by session 'existing-session'. Use a custom path override or stop the other session.`,
    );
  });
});
