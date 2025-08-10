import { IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class LoggerConfig {
  @IsString()
  public readonly level!: string;

  @IsBoolean()
  @Type(() => Boolean)
  public readonly prettyPrint!: boolean;
}
