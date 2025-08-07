import { IsNumber, IsString, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { DockerConfig } from './docker.config';
import { SessionConfig } from './session.config';
import { LoggerConfig } from './logger.config';

export class AppConfig {
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly port: number = 3001;

  @IsString()
  @IsOptional()
  public readonly nodeEnv: string = 'development';

  @ValidateNested()
  @Type(() => DockerConfig)
  public readonly docker!: DockerConfig;

  @ValidateNested()
  @Type(() => SessionConfig)
  public readonly session!: SessionConfig;

  @ValidateNested()
  @Type(() => LoggerConfig)
  public readonly logger!: LoggerConfig;
}