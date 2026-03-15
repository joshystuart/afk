import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { toBooleanTransform } from '../../decorators/boolean-transform.decorator';

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

  @Transform(toBooleanTransform)
  @IsBoolean()
  @IsOptional()
  public readonly synchronize?: boolean;

  @Transform(toBooleanTransform)
  @IsBoolean()
  @IsOptional()
  public readonly logging?: boolean;
}
