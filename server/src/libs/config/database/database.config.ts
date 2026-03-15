import {
  IsString,
  IsOptional,
  ValidateNested,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SqliteConfig } from './sqlite.config';
import { PostgresConfig } from './postgres.config';

export class DatabaseConfig {
  @IsString()
  @IsIn(['sqlite', 'postgres'])
  public readonly type!: 'sqlite' | 'postgres';

  @ValidateIf((o) => o.type === 'sqlite')
  @ValidateNested()
  @Type(() => SqliteConfig)
  @IsOptional()
  public readonly sqlite?: SqliteConfig;

  @ValidateIf((o) => o.type === 'postgres')
  @ValidateNested()
  @Type(() => PostgresConfig)
  @IsOptional()
  public readonly postgres?: PostgresConfig;
}
