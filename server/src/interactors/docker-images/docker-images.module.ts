import { Module } from '@nestjs/common';
import { DockerImagesController } from './docker-images.controller';
import { DockerModule } from '../../services/docker/docker.module';
import { ResponseModule } from '../../libs/response/response.module';

@Module({
  imports: [DockerModule, ResponseModule],
  controllers: [DockerImagesController],
})
export class DockerImagesInteractorModule {}
