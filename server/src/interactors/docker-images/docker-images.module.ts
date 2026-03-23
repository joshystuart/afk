import { Module } from '@nestjs/common';
import { DockerImagesController } from './docker-images.controller';
import { CreateDockerImageInteractor } from './create-docker-image.interactor';
import { DockerModule } from '../../libs/docker/docker.module';
import { DeleteDockerImageInteractor } from './delete-docker-image.interactor';
import { GetDockerImageStatusInteractor } from './get-docker-image-status.interactor';
import { InstallDockerImageInteractor } from './install-docker-image.interactor';
import { ListDockerImagesInteractor } from './list-docker-images.interactor';
import { ResponseModule } from '../../libs/response/response.module';
import { RetryDockerImageInteractor } from './retry-docker-image.interactor';
import { SetDefaultDockerImageInteractor } from './set-default-docker-image.interactor';

@Module({
  imports: [DockerModule, ResponseModule],
  controllers: [DockerImagesController],
  providers: [
    ListDockerImagesInteractor,
    CreateDockerImageInteractor,
    DeleteDockerImageInteractor,
    SetDefaultDockerImageInteractor,
    GetDockerImageStatusInteractor,
    InstallDockerImageInteractor,
    RetryDockerImageInteractor,
  ],
})
export class DockerImagesInteractorModule {}
