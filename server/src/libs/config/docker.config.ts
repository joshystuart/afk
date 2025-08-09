import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class DockerConfig {
  @IsString()
  @IsOptional()
  public readonly socketPath: string =
    process.env.DOCKER_HOST?.replace('unix://', '') || '/var/run/docker.sock';

  @IsString()
  @IsOptional()
  public readonly imageName: string = 'afk:latest';

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly startPort: number = 7681;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly endPort: number = 7780;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  public readonly maxContainers: number = 50;
}
