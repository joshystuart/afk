import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsRequest {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'SSH private key for git operations' })
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
}