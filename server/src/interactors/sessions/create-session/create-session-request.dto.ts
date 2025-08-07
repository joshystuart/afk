import { IsString, IsOptional, IsEmail, IsEnum, MinLength, MaxLength, IsUrl, Allow } from 'class-validator';
import { TerminalMode } from '../../../domain/sessions/terminal-mode.enum';

export class CreateSessionRequest {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsUrl()
  repoUrl?: string;

  @IsOptional()
  @IsString()
  branch?: string;

  @IsOptional()
  @IsString()
  gitUserName?: string;

  @IsOptional()
  @IsEmail()
  gitUserEmail?: string;

  @IsOptional()
  @IsString()
  sshPrivateKey?: string;

  @IsOptional()
  @IsEnum(TerminalMode)
  terminalMode?: TerminalMode;

  @IsOptional()
  @IsString()
  claudeToken?: string;

  // This would be populated from authentication context
  @Allow()
  userId?: string;
}