import { IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class DockerConfig {
  @IsString()
  public readonly socketPath!: string;

  @IsNumber()
  @Type(() => Number)
  public readonly startPort!: number;

  @IsNumber()
  @Type(() => Number)
  public readonly endPort!: number;
}
