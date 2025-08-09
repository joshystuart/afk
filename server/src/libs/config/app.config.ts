import {
  IsNumber,
  IsString,
  ValidateNested,
  IsOptional,
} from 'class-validator';
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

  @IsString()
  @IsOptional()
  public readonly baseUrl: string = 'http://localhost';

  @ValidateNested()
  @Type(() => DockerConfig)
  @IsOptional()
  public readonly docker: DockerConfig = new DockerConfig();

  @ValidateNested()
  @Type(() => SessionConfig)
  @IsOptional()
  public readonly session: SessionConfig = new SessionConfig();

  @ValidateNested()
  @Type(() => LoggerConfig)
  @IsOptional()
  public readonly logger: LoggerConfig = new LoggerConfig();
}
