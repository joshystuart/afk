import {
  IsString,
  IsOptional,
  IsEmail,
  IsUUID,
  IsBoolean,
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

  @IsString()
  @IsUUID('4')
  imageId!: string;

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
  @IsBoolean()
  mountToHost?: boolean;

  @IsOptional()
  @IsString()
  hostMountPath?: string;

  @IsOptional()
  @IsBoolean()
  cleanupOnDelete?: boolean;

  // This would be populated from authentication context
  @Allow()
  userId?: string;
}
