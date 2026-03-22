import { Injectable } from '@nestjs/common';
import { DockerImage } from '../../domain/docker-images/docker-image.entity';
import { DockerImageService } from '../../services/docker/docker-image.service';

@Injectable()
export class ListDockerImagesInteractor {
  constructor(private readonly dockerImageService: DockerImageService) {}

  async execute(): Promise<DockerImage[]> {
    return await this.dockerImageService.listAll();
  }
}
