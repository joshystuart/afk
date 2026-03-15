import { IsString, IsOptional, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { SqliteConfig } from './sqlite.config';
import { PostgresConfig } from './postgres.config';

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
