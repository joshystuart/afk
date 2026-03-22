import { Module } from '@nestjs/common';
import { DockerEngineService } from './docker-engine.service';
import { DockerImageService } from './docker-image.service';
import { PortManagerService } from './port-manager.service';
import { ContainerLogStreamService } from './container-log-stream.service';
import { PortPairDtoFactory } from '../../domain/containers/port-pair-dto.factory';
import { DockerImagesModule } from '../../domain/docker-images/docker-images.module';
import { DockerClientService } from './docker-client.service';
import { DockerContainerExecService } from './docker-container-exec.service';
import { DockerContainerProvisioningService } from './docker-container-provisioning.service';
import { DockerContainerReadinessService } from './docker-container-readiness.service';
import { DockerContainerStateService } from './docker-container-state.service';
import { DockerImageRuntimeService } from './docker-image-runtime.service';
import { SettingsPersistenceModule } from '../settings/settings-persistence.module';

@Module({
  imports: [DockerImagesModule, SettingsPersistenceModule],
  providers: [
    DockerClientService,
    DockerImageRuntimeService,
    DockerContainerProvisioningService,
    DockerContainerExecService,
    DockerContainerStateService,
    DockerContainerReadinessService,
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
