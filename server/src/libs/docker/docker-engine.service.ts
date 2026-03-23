import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import {
  ContainerCreateOptions,
  ContainerInfo,
  ContainerStats,
  EphemeralContainerCreateOptions,
} from '../../domain/containers/container.entity';
import { DockerClientService } from './docker-client.service';
import { DockerContainerExecService } from './docker-container-exec.service';
import { DockerContainerProvisioningService } from './docker-container-provisioning.service';
import { DockerContainerReadinessService } from './docker-container-readiness.service';
import { DockerContainerStateService } from './docker-container-state.service';

@Injectable()
export class DockerEngineService implements OnModuleInit {
  constructor(
    private readonly dockerClient: DockerClientService,
    private readonly dockerContainerProvisioning: DockerContainerProvisioningService,
    private readonly dockerContainerExec: DockerContainerExecService,
    private readonly dockerContainerState: DockerContainerStateService,
    private readonly dockerContainerReadiness: DockerContainerReadinessService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.dockerClient.getClient();
  }

  async createContainer(
    options: ContainerCreateOptions,
  ): Promise<Dockerode.Container> {
    await this.ping();
    return this.dockerContainerProvisioning.createContainer(options);
  }

  async createEphemeralContainer(
    options: EphemeralContainerCreateOptions,
  ): Promise<Dockerode.Container> {
    await this.ping();
    return this.dockerContainerProvisioning.createEphemeralContainer(options);
  }

  async stopContainer(containerId: string): Promise<void> {
    return this.dockerContainerState.stopContainer(containerId);
  }

  async startContainer(containerId: string): Promise<void> {
    return this.dockerContainerState.startContainer(containerId);
  }

  async removeContainer(containerId: string): Promise<void> {
    return this.dockerContainerState.removeContainer(containerId);
  }

  async removeVolume(volumeName: string): Promise<void> {
    return this.dockerContainerState.removeVolume(volumeName);
  }

  async removeSessionVolumes(sessionId: string): Promise<void> {
    return this.dockerContainerState.removeSessionVolumes(sessionId);
  }

  async getContainerInfo(containerId: string): Promise<ContainerInfo> {
    return this.dockerContainerState.getContainerInfo(containerId);
  }

  async listAFKContainers(): Promise<ContainerInfo[]> {
    return this.dockerContainerState.listAFKContainers();
  }

  async getContainerStats(containerId: string): Promise<ContainerStats> {
    return this.dockerContainerState.getContainerStats(containerId);
  }

  async openContainerFollowLogStream(
    containerId: string,
  ): Promise<NodeJS.ReadableStream> {
    return this.dockerContainerExec.openContainerFollowLogStream(containerId);
  }

  async execInContainer(
    containerId: string,
    cmd: string[],
    workingDir?: string,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return this.dockerContainerExec.execInContainer(
      containerId,
      cmd,
      workingDir,
    );
  }

  async execStreamInContainer(
    containerId: string,
    cmd: string[],
    onData: (data: string) => void,
    workingDir?: string,
  ): Promise<{ stream: NodeJS.ReadableStream; kill: () => Promise<void> }> {
    return this.dockerContainerExec.execStreamInContainer(
      containerId,
      cmd,
      onData,
      workingDir,
    );
  }

  async waitForContainerReady(
    containerId: string,
    options?: { maxWaitMs?: number; pollMs?: number },
  ): Promise<void> {
    return this.dockerContainerReadiness.waitForContainerReady(
      containerId,
      options,
    );
  }

  async isContainerReady(containerId: string): Promise<boolean> {
    return this.dockerContainerReadiness.isContainerReady(containerId);
  }

  async ping(): Promise<void> {
    return this.dockerContainerReadiness.ping();
  }

  async waitForDockerReady(options?: {
    maxWaitMs?: number;
    initialDelayMs?: number;
  }): Promise<void> {
    return this.dockerContainerReadiness.waitForDockerReady(options);
  }
}
