import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateSettingsRequest {
  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'SSH private key for git operations',
  })
  sshPrivateKey?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Claude API token' })
  claudeToken?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Git user name' })
  gitUserName?: string;

  @IsOptional()
  @IsEmail()
  @ApiProperty({ required: false, description: 'Git user email' })
  gitUserEmail?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Base directory on the host for mounting session workspaces',
  })
  defaultMountDirectory?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description:
      'Host directory containing agent skills, mounted read-only into containers',
  })
  skillsDirectory?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'Docker socket path (e.g. /var/run/docker.sock)',
  })
  dockerSocketPath?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    required: false,
    description: 'Start of the port range for Docker containers',
  })
  dockerStartPort?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @ApiProperty({
    required: false,
    description: 'End of the port range for Docker containers',
  })
  dockerEndPort?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({
    required: false,
    description: 'GitHub Personal Access Token',
  })
  githubAccessToken?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    required: false,
    description: 'Whether idle session cleanup is enabled',
  })
  idleCleanupEnabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiProperty({
    required: false,
    description: 'Minutes of inactivity before a session is auto-stopped',
  })
  idleTimeoutMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    required: false,
    description: 'IDE command used to open workspaces (e.g. "cursor", "code")',
  })
  ideCommand?: string;
}
