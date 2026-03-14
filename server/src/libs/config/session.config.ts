import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SessionConfig {
  @IsNumber()
  @Type(() => Number)
  public readonly maxSessionsPerUser!: number;
}
