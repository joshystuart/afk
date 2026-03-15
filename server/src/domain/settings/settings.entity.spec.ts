import { Settings, SettingsValidationError } from './settings.entity';
import { GeneralSettings } from './general-settings.embedded';
import { GitSettings } from './git-settings.embedded';
import { DockerSettings } from './docker-settings.embedded';

describe('Settings', () => {
  let settings: Settings;

  beforeEach(() => {
    settings = new Settings();
  });

  describe('constructor', () => {
    it('should initialize with embedded entity instances', () => {
      expect(settings.general).toBeInstanceOf(GeneralSettings);
      expect(settings.git).toBeInstanceOf(GitSettings);
      expect(settings.docker).toBeInstanceOf(DockerSettings);
    });

    it('should default id to "default"', () => {
      expect(settings.id).toBe('default');
    });
  });

  describe('applyDefaults', () => {
    it('should apply docker defaults', () => {
      settings.docker.socketPath = null as any;
      settings.docker.startPort = null as any;
      settings.docker.endPort = null as any;

      settings.applyDefaults();

      expect(settings.docker.socketPath).toBe('/var/run/docker.sock');
      expect(settings.docker.startPort).toBe(7681);
      expect(settings.docker.endPort).toBe(7780);
    });

    it('should apply git defaults', () => {
      settings.git.githubCallbackUrl = null as any;
      settings.git.githubFrontendRedirectUrl = null as any;

      settings.applyDefaults();

      expect(settings.git.githubCallbackUrl).toBe(
        'http://localhost:3001/api/github/callback',
      );
      expect(settings.git.githubFrontendRedirectUrl).toBe(
        'http://localhost:5173/settings',
      );
    });

    it('should not overwrite existing values', () => {
      settings.docker.socketPath = '/custom/socket.sock';
      settings.docker.startPort = 9000;

      settings.applyDefaults();

      expect(settings.docker.socketPath).toBe('/custom/socket.sock');
      expect(settings.docker.startPort).toBe(9000);
    });

    it('should return this for chaining', () => {
      const result = settings.applyDefaults();
      expect(result).toBe(settings);
    });
  });

  describe('update', () => {
    it('should update general settings fields', () => {
      settings.update({
        claudeToken: 'sk-test-token',
        defaultMountDirectory: '/mnt/data',
      });

      expect(settings.general.claudeToken).toBe('sk-test-token');
      expect(settings.general.defaultMountDirectory).toBe('/mnt/data');
    });

    it('should update git settings fields', () => {
      settings.update({
        sshPrivateKey: '-----BEGIN KEY-----\ntest\n-----END KEY-----',
        gitUserName: 'Test User',
        gitUserEmail: 'test@example.com',
      });

      expect(settings.git.sshPrivateKey).toBe(
        '-----BEGIN KEY-----\ntest\n-----END KEY-----',
      );
      expect(settings.git.userName).toBe('Test User');
      expect(settings.git.userEmail).toBe('test@example.com');
    });

    it('should update docker settings fields', () => {
      settings.update({
        dockerSocketPath: '/custom/docker.sock',
        dockerStartPort: 8000,
        dockerEndPort: 9000,
      });

      expect(settings.docker.socketPath).toBe('/custom/docker.sock');
      expect(settings.docker.startPort).toBe(8000);
      expect(settings.docker.endPort).toBe(9000);
    });

    it('should update github OAuth fields', () => {
      settings.update({
        githubClientId: 'client-123',
        githubClientSecret: 'secret-456',
        githubCallbackUrl: 'https://example.com/callback',
        githubFrontendRedirectUrl: 'https://example.com/settings',
      });

      expect(settings.git.githubClientId).toBe('client-123');
      expect(settings.git.githubClientSecret).toBe('secret-456');
      expect(settings.git.githubCallbackUrl).toBe(
        'https://example.com/callback',
      );
      expect(settings.git.githubFrontendRedirectUrl).toBe(
        'https://example.com/settings',
      );
    });

    it('should not modify fields that are not in the update data', () => {
      settings.update({
        claudeToken: 'initial-token',
        gitUserName: 'Initial User',
      });

      settings.update({ claudeToken: 'updated-token' });

      expect(settings.general.claudeToken).toBe('updated-token');
      expect(settings.git.userName).toBe('Initial User');
    });

    it('should ignore undefined values', () => {
      settings.update({ claudeToken: 'original' });
      settings.update({ claudeToken: undefined });

      expect(settings.general.claudeToken).toBe('original');
    });

    it('should update the updatedAt timestamp', () => {
      const before = new Date();
      settings.update({ claudeToken: 'test' });
      const after = new Date();

      expect(settings.updatedAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(settings.updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should initialize null embedded entities defensively', () => {
      settings.general = null as any;
      settings.git = null as any;
      settings.docker = null as any;

      settings.update({
        claudeToken: 'token',
        gitUserName: 'User',
        dockerStartPort: 8000,
        dockerEndPort: 9000,
      });

      expect(settings.general).toBeInstanceOf(GeneralSettings);
      expect(settings.git).toBeInstanceOf(GitSettings);
      expect(settings.docker).toBeInstanceOf(DockerSettings);
      expect(settings.general.claudeToken).toBe('token');
    });
  });

  describe('port range validation', () => {
    it('should accept valid port ranges', () => {
      expect(() => {
        settings.update({ dockerStartPort: 1024, dockerEndPort: 65535 });
      }).not.toThrow();
    });

    it('should accept a single-port range (start === end)', () => {
      expect(() => {
        settings.update({ dockerStartPort: 8080, dockerEndPort: 8080 });
      }).not.toThrow();
    });

    it('should reject startPort > endPort', () => {
      expect(() => {
        settings.update({ dockerStartPort: 9000, dockerEndPort: 8000 });
      }).toThrow(SettingsValidationError);
      expect(() => {
        settings.update({ dockerStartPort: 9000, dockerEndPort: 8000 });
      }).toThrow(/must not exceed/);
    });

    it('should reject startPort below 1', () => {
      expect(() => {
        settings.update({ dockerStartPort: 0, dockerEndPort: 100 });
      }).toThrow(SettingsValidationError);
      expect(() => {
        settings.update({ dockerStartPort: 0, dockerEndPort: 100 });
      }).toThrow(/between 1 and 65535/);
    });

    it('should reject endPort above 65535', () => {
      expect(() => {
        settings.update({ dockerStartPort: 1000, dockerEndPort: 70000 });
      }).toThrow(SettingsValidationError);
      expect(() => {
        settings.update({ dockerStartPort: 1000, dockerEndPort: 70000 });
      }).toThrow(/between 1 and 65535/);
    });

    it('should reject negative ports', () => {
      expect(() => {
        settings.update({ dockerStartPort: -1, dockerEndPort: 100 });
      }).toThrow(SettingsValidationError);
    });

    it('should reject non-integer ports', () => {
      expect(() => {
        settings.update({ dockerStartPort: 1000.5, dockerEndPort: 2000 });
      }).toThrow(SettingsValidationError);
      expect(() => {
        settings.update({ dockerStartPort: 1000.5, dockerEndPort: 2000 });
      }).toThrow(/integers/);
    });

    it('should validate against existing ports when only one port is updated', () => {
      settings.update({ dockerStartPort: 8000, dockerEndPort: 9000 });

      expect(() => {
        settings.update({ dockerStartPort: 9500 });
      }).toThrow(SettingsValidationError);
    });

    it('should accept the default port range', () => {
      expect(() => {
        settings.update({});
      }).not.toThrow();
    });
  });
});
