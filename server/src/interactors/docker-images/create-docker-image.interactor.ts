import { Injectable } from '@nestjs/common';
import { DockerImage } from '../../domain/docker-images/docker-image.entity';
import { DockerImageService } from '../../services/docker/docker-image.service';

@Injectable()
export class CreateDockerImageInteractor {
  constructor(private readonly dockerImageService: DockerImageService) {}

  async execute(name: string, image: string): Promise<DockerImage> {
    return await this.dockerImageService.registerAndPull(name, image);
  }
}
