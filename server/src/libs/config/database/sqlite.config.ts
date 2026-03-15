import { IsString, IsBoolean, IsOptional } from 'class-validator';

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
