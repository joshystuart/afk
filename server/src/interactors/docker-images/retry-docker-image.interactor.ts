import { Injectable } from '@nestjs/common';
import { DockerImage } from '../../domain/docker-images/docker-image.entity';
import { DockerImageService } from '../../libs/docker/docker-image.service';

@Injectable()
export class RetryDockerImageInteractor {
  constructor(private readonly dockerImageService: DockerImageService) {}

  async execute(id: string): Promise<DockerImage> {
    return await this.dockerImageService.retryPull(id);
  }
}
