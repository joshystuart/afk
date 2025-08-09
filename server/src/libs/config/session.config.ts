import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SessionConfig {
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly maxSessionsPerUser: number = 10;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly sessionTimeoutMinutes: number = 60;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly cleanupIntervalMinutes: number = 10;
}
