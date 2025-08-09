import { Module } from '@nestjs/common';
import { DockerEngineService } from './docker-engine.service';
import { PortManagerService } from './port-manager.service';
import { PortPairDtoFactory } from '../../domain/containers/port-pair-dto.factory';
import { DockerConfig } from '../../libs/config/docker.config';

@Module({
  providers: [DockerEngineService, PortManagerService, PortPairDtoFactory],
  exports: [DockerEngineService, PortManagerService],
})
export class DockerModule {}
