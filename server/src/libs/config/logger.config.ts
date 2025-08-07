import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class LoggerConfig {
  @IsString()
  @IsOptional()
  public readonly level: string = 'info';

  @IsBoolean()
  @Type(() => Boolean)
  @IsOptional()
  public readonly pretty: boolean = true;
}