import { Module } from '@nestjs/common';
import { DockerEngineService } from './docker-engine.service';
import { DockerImageService } from './docker-image.service';
import { PortManagerService } from './port-manager.service';
import { ContainerLogStreamService } from './container-log-stream.service';
import { PortPairDtoFactory } from '../../domain/containers/port-pair-dto.factory';
import { DockerImagesModule } from '../../domain/docker-images/docker-images.module';
import { SettingsPersistenceModule } from '../../libs/settings/settings-persistence.module';

@Module({
  imports: [DockerImagesModule, SettingsPersistenceModule],
  providers: [
    DockerEngineService,
    ContainerLogStreamService,
    DockerImageService,
    PortManagerService,
    PortPairDtoFactory,
  ],
  exports: [
    DockerEngineService,
    ContainerLogStreamService,
    DockerImageService,
    PortManagerService,
  ],
})
export class DockerModule {}
