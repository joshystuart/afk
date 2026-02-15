import { IsString, IsOptional } from 'class-validator';

export class GitHubConfig {
  @IsString()
  @IsOptional()
  public readonly clientId!: string;

  @IsString()
  @IsOptional()
  public readonly clientSecret!: string;

  @IsString()
  @IsOptional()
  public readonly callbackUrl!: string;
}
