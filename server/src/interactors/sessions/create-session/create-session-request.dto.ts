import { IsString, IsOptional, IsEmail, MinLength, MaxLength, Allow, IsEnum } from 'class-validator';
import { TerminalMode } from '../../../domain/sessions/terminal-mode.enum';
import { IsGitUrl } from '../../../libs/validators/git-url.validator';

export class CreateSessionRequest {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name!: string;

  @IsOptional()
  @IsGitUrl()
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
  @IsEnum(TerminalMode)
  terminalMode?: TerminalMode;

  // This would be populated from authentication context
  @Allow()
  userId?: string;
}