import { IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SessionConfig } from './session.config';
import { LoggerConfig } from './logger.config';
import { AdminUserConfig } from './admin-user.config';
import { AuthConfig } from '../auth/auth.config';

export class AppConfig {
  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;

  @IsString()
  public readonly nodeEnv!: string;

  @IsString()
  public readonly baseUrl!: string;

  @ValidateNested()
  @Type(() => SessionConfig)
  public readonly session!: SessionConfig;

  @ValidateNested()
  @Type(() => LoggerConfig)
  public readonly logger!: LoggerConfig;

  @ValidateNested()
  @Type(() => AdminUserConfig)
  public readonly adminUser!: AdminUserConfig;

  @ValidateNested()
  @Type(() => AuthConfig)
  public readonly auth!: AuthConfig;
}
