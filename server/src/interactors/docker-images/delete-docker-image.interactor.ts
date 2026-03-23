import { Injectable } from '@nestjs/common';
import { DockerImageService } from '../../libs/docker/docker-image.service';

@Injectable()
export class DeleteDockerImageInteractor {
  constructor(private readonly dockerImageService: DockerImageService) {}

  async execute(id: string): Promise<void> {
    await this.dockerImageService.deleteImage(id);
  }
}
