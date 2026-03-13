import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DockerImage } from './docker-image.entity';
import { DockerImageRepository } from './docker-image.repository';
import { DockerImageSeedService } from './docker-image-seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([DockerImage])],
  providers: [DockerImageRepository, DockerImageSeedService],
  exports: [DockerImageRepository],
})
export class DockerImagesModule {}
