import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { toBooleanTransform } from '../../decorators/boolean-transform.decorator';

export class SqliteConfig {
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
