import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateDockerImageRequest {
  @ApiProperty({ description: 'Display name for the image' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Docker image reference (e.g. "myimage:latest")',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  image: string;
}
