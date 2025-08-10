import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SessionConfig {
  @IsNumber()
  @Type(() => Number)
  public readonly maxSessionsPerUser!: number;

  @IsNumber()
  @Type(() => Number)
  public readonly sessionTimeoutMinutes!: number;

  @IsNumber()
  @Type(() => Number)
  public readonly healthCheckIntervalSeconds!: number;
}
