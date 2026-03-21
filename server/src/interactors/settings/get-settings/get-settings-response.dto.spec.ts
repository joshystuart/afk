import { GetSettingsResponseDto } from './get-settings-response.dto';
import { Settings } from '../../../domain/settings/settings.entity';

describe('GetSettingsResponseDto', () => {
  describe('obfuscateToken', () => {
    it('should return null for null input', () => {
      expect(GetSettingsResponseDto.obfuscateToken(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(GetSettingsResponseDto.obfuscateToken(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(GetSettingsResponseDto.obfuscateToken('')).toBeNull();
    });

    it('should fully mask tokens of 8 characters or fewer', () => {
      expect(GetSettingsResponseDto.obfuscateToken('short')).toBe('••••••••');
      expect(GetSettingsResponseDto.obfuscateToken('12345678')).toBe(
        '••••••••',
      );
    });

    it('should show prefix and suffix for tokens longer than 8 characters', () => {
      const result = GetSettingsResponseDto.obfuscateToken(
        'sk-abcdefghijklmnop',
      );
      expect(result).toMatch(/^sk-a•+mnop$/);
    });

    it('should cap the bullet count at 20', () => {
      const longToken = 'a'.repeat(100);
      const result = GetSettingsResponseDto.obfuscateToken(longToken);
      const bulletCount = (result!.match(/•/g) || []).length;
      expect(bulletCount).toBe(20);
    });

    it('should show first 4 and last 4 characters', () => {
      const result = GetSettingsResponseDto.obfuscateToken('0123456789abcdef');
      expect(result!.startsWith('0123')).toBe(true);
      expect(result!.endsWith('cdef')).toBe(true);
    });
  });

  describe('fromDomain', () => {
    let settings: Settings;

    beforeEach(() => {
      settings = new Settings();
      settings.applyDefaults();
      settings.updatedAt = new Date('2025-01-01T00:00:00Z');
    });

    it('should map empty settings correctly', () => {
      const dto = GetSettingsResponseDto.fromDomain(settings);

      expect(dto.hasSshPrivateKey).toBe(false);
      expect(dto.hasClaudeToken).toBe(false);
      expect(dto.claudeToken).toBeNull();
      expect(dto.gitUserName).toBeNull();
      expect(dto.gitUserEmail).toBeNull();
      expect(dto.hasGitHubToken).toBe(false);
      expect(dto.githubUsername).toBeUndefined();
      expect(dto.defaultMountDirectory).toBeNull();
    });

    it('should map docker settings', () => {
      const dto = GetSettingsResponseDto.fromDomain(settings);

      expect(dto.dockerSocketPath).toBe('/var/run/docker.sock');
      expect(dto.dockerStartPort).toBe(7681);
      expect(dto.dockerEndPort).toBe(7780);
    });

    it('should obfuscate claude token in response', () => {
      settings.general.claudeToken = 'sk-ant-very-long-token-value';
      const dto = GetSettingsResponseDto.fromDomain(settings);

      expect(dto.hasClaudeToken).toBe(true);
      expect(dto.claudeToken).toContain('•');
      expect(dto.claudeToken).not.toBe('sk-ant-very-long-token-value');
    });

    it('should set boolean flags based on presence of secrets', () => {
      settings.git.sshPrivateKey = 'some-key';
      settings.general.claudeToken = 'some-token';
      settings.git.githubAccessToken = 'gh-token';

      const dto = GetSettingsResponseDto.fromDomain(settings);

      expect(dto.hasSshPrivateKey).toBe(true);
      expect(dto.hasClaudeToken).toBe(true);
      expect(dto.hasGitHubToken).toBe(true);
    });

    it('should serialize updatedAt as ISO string', () => {
      const dto = GetSettingsResponseDto.fromDomain(settings);
      expect(dto.updatedAt).toBe('2025-01-01T00:00:00.000Z');
    });
  });
});
