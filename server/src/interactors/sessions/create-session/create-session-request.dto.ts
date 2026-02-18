import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Allow,
} from 'class-validator';
import { IsGitUrl } from '../../../libs/validators/git-url.validator';

export class CreateSessionRequest {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name?: string;

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

  // This would be populated from authentication context
  @Allow()
  userId?: string;
}
