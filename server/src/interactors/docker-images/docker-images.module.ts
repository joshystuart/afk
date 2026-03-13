import { Module } from '@nestjs/common';
import { DockerImagesController } from './docker-images.controller';
import { DockerModule } from '../../services/docker/docker.module';
import { ResponseService } from '../../libs/response/response.service';

@Module({
  imports: [DockerModule],
  controllers: [DockerImagesController],
  providers: [ResponseService],
})
export class DockerImagesInteractorModule {}
