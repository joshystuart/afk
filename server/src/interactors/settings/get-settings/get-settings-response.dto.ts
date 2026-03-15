import { ApiProperty } from '@nestjs/swagger';
import { Settings } from '../../../domain/settings/settings.entity';

export class GetSettingsResponseDto {
  @ApiProperty({ description: 'Whether an SSH private key is configured' })
  hasSshPrivateKey!: boolean;

  @ApiProperty({ description: 'Whether a Claude token is configured' })
  hasClaudeToken!: boolean;

  @ApiProperty({
    required: false,
    description: 'Obfuscated Claude token (e.g. sk-a…abcd)',
  })
  claudeToken?: string | null;

  @ApiProperty({ required: false, nullable: true })
  gitUserName?: string | null;

  @ApiProperty({ required: false, nullable: true })
  gitUserEmail?: string | null;

  @ApiProperty({ description: 'Whether GitHub is connected' })
  hasGitHubToken!: boolean;

  @ApiProperty({ required: false, description: 'Connected GitHub username' })
  githubUsername?: string;

  @ApiProperty({ required: false, nullable: true })
  defaultMountDirectory?: string | null;

  @ApiProperty({ description: 'Docker socket path' })
  dockerSocketPath!: string;

  @ApiProperty({ description: 'Start of port range for Docker containers' })
  dockerStartPort!: number;

  @ApiProperty({ description: 'End of port range for Docker containers' })
  dockerEndPort!: number;

  @ApiProperty({ required: false, nullable: true })
  githubClientId?: string | null;

  @ApiProperty({
    required: false,
    nullable: true,
    description: 'Whether a GitHub client secret is configured',
  })
  hasGithubClientSecret!: boolean;

  @ApiProperty({ description: 'GitHub OAuth callback URL' })
  githubCallbackUrl!: string;

  @ApiProperty({ description: 'Frontend redirect URL after GitHub OAuth' })
  githubFrontendRedirectUrl!: string;

  @ApiProperty()
  updatedAt!: string;

  static obfuscateToken(token?: string | null): string | null {
    if (!token) return null;

    if (token.length <= 8) {
      return '••••••••';
    }

    const prefix = token.slice(0, 4);
    const suffix = token.slice(-4);
    return `${prefix}${'•'.repeat(Math.min(token.length - 8, 20))}${suffix}`;
  }

  static fromDomain(settings: Settings): GetSettingsResponseDto {
    const dto = new GetSettingsResponseDto();
    dto.hasSshPrivateKey = !!settings.git.sshPrivateKey;
    dto.hasClaudeToken = !!settings.general.claudeToken;
    dto.claudeToken = GetSettingsResponseDto.obfuscateToken(
      settings.general.claudeToken,
    );
    dto.gitUserName = settings.git.userName ?? null;
    dto.gitUserEmail = settings.git.userEmail ?? null;
    dto.hasGitHubToken = !!settings.git.githubAccessToken;
    dto.githubUsername = settings.git.githubUsername ?? undefined;
    dto.defaultMountDirectory = settings.general.defaultMountDirectory ?? null;
    dto.dockerSocketPath = settings.docker.socketPath;
    dto.dockerStartPort = settings.docker.startPort;
    dto.dockerEndPort = settings.docker.endPort;
    dto.githubClientId = settings.git.githubClientId ?? null;
    dto.hasGithubClientSecret = !!settings.git.githubClientSecret;
    dto.githubCallbackUrl = settings.git.githubCallbackUrl;
    dto.githubFrontendRedirectUrl = settings.git.githubFrontendRedirectUrl;
    dto.updatedAt = settings.updatedAt.toISOString();
    return dto;
  }
}
