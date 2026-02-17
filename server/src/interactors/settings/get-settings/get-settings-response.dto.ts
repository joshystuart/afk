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

  @ApiProperty()
  updatedAt!: string;

  static obfuscateToken(token?: string): string | null {
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
    dto.hasSshPrivateKey = !!settings.sshPrivateKey;
    dto.hasClaudeToken = !!settings.claudeToken;
    dto.claudeToken = GetSettingsResponseDto.obfuscateToken(
      settings.claudeToken,
    );
    dto.gitUserName = settings.gitUserName ?? null;
    dto.gitUserEmail = settings.gitUserEmail ?? null;
    dto.hasGitHubToken = !!settings.githubAccessToken;
    dto.githubUsername = settings.githubUsername ?? undefined;
    dto.updatedAt = settings.updatedAt.toISOString();
    return dto;
  }
}
