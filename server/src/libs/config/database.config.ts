import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SqliteConfig {
  @IsString()
  public readonly database!: string;

  @IsBoolean()
  @IsOptional()
  public readonly synchronize?: boolean;

  @IsBoolean()
  @IsOptional()
  public readonly logging?: boolean;
}

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

export class DatabaseConfig {
  @IsString()
  @IsIn(['sqlite', 'postgres'])
  public readonly type!: 'sqlite' | 'postgres';

  @ValidateNested()
  @Type(() => SqliteConfig)
  @IsOptional()
  public readonly sqlite?: SqliteConfig;

  @ValidateNested()
  @Type(() => PostgresConfig)
  @IsOptional()
  public readonly postgres?: PostgresConfig;
}
