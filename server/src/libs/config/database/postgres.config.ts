import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class PostgresConfig {
  @IsString()
  public readonly host!: string;

  @IsNumber()
  @Type(() => Number)
  public readonly port!: number;

  @IsString()
  public readonly username!: string;

  @IsString()
  public readonly password!: string;

  @IsString()
  public readonly database!: string;

  @IsBoolean()
  @IsOptional()
  public readonly synchronize?: boolean;

  @IsBoolean()
  @IsOptional()
  public readonly logging?: boolean;
}
