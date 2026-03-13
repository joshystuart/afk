import { ApiProperty } from '@nestjs/swagger';
import { DockerImage } from '../../domain/docker-images/docker-image.entity';
import { DockerImageStatus } from '../../domain/docker-images/docker-image-status.enum';

export class DockerImageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isBuiltIn: boolean;

  @ApiProperty({ enum: DockerImageStatus })
  status: DockerImageStatus;

  @ApiProperty({ nullable: true })
  errorMessage: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  static fromDomain(entity: DockerImage): DockerImageResponseDto {
    const dto = new DockerImageResponseDto();
    dto.id = entity.id;
    dto.name = entity.name;
    dto.image = entity.image;
    dto.isDefault = entity.isDefault;
    dto.isBuiltIn = entity.isBuiltIn;
    dto.status = entity.status;
    dto.errorMessage = entity.errorMessage;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
