import { Module } from '@nestjs/common';
import { DockerEngineService } from './docker-engine.service';
import { DockerImageService } from './docker-image.service';
import { PortManagerService } from './port-manager.service';
import { ContainerLogStreamService } from './container-log-stream.service';
import { PortPairDtoFactory } from '../../domain/containers/port-pair-dto.factory';
import { DockerImagesModule } from '../../domain/docker-images/docker-images.module';
import { SettingsModule } from '../../interactors/settings/settings.module';

@Module({
  imports: [DockerImagesModule, SettingsModule],
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
