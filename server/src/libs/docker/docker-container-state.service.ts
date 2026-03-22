import { Injectable, Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import {
  ContainerHealth,
  ContainerInfo,
  ContainerStats,
} from '../../domain/containers/container.entity';
import { ContainerNotFoundError } from './container-not-found.error';
import { DockerClientService } from './docker-client.service';
import { isDockerStatusCodeError } from './docker-error.utils';

@Injectable()
export class DockerContainerStateService {
  private readonly logger = new Logger(DockerContainerStateService.name);

  constructor(private readonly dockerClient: DockerClientService) {}

  async stopContainer(containerId: string): Promise<void> {
    try {
      const docker = await this.dockerClient.getClient();
      const container = docker.getContainer(containerId);
      await container.stop({ t: 10 });
    } catch (error: unknown) {
      if (!isDockerStatusCodeError(error) || error.statusCode !== 304) {
        throw error;
      }
    }
  }

  async startContainer(containerId: string): Promise<void> {
    try {
      const docker = await this.dockerClient.getClient();
      const container = docker.getContainer(containerId);
      await container.start();
    } catch (error: unknown) {
      if (!isDockerStatusCodeError(error) || error.statusCode !== 304) {
        throw error;
      }
    }
  }

  async removeContainer(containerId: string): Promise<void> {
    try {
      const docker = await this.dockerClient.getClient();
      const container = docker.getContainer(containerId);
      await container.remove({ force: true });
    } catch (error: unknown) {
      if (
        isDockerStatusCodeError(error) &&
        error.statusCode === 404 &&
        error.reason === 'no such container'
      ) {
        throw new ContainerNotFoundError(containerId, error);
      }

      throw error;
    }
  }

  async removeVolume(volumeName: string): Promise<void> {
    try {
      const docker = await this.dockerClient.getClient();
      const volume = docker.getVolume(volumeName);
      await volume.remove();
      this.logger.log(`Volume removed: ${volumeName}`);
    } catch (error: unknown) {
      if (isDockerStatusCodeError(error) && error.statusCode === 404) {
        this.logger.warn(`Volume not found (already removed): ${volumeName}`);
        return;
      }

      throw error;
    }
  }

  async removeSessionVolumes(sessionId: string): Promise<void> {
    const volumeNames = [`afk-tmux-${sessionId}`, `afk-claude-${sessionId}`];
    await Promise.all(volumeNames.map((name) => this.removeVolume(name)));
  }

  async getContainerInfo(containerId: string): Promise<ContainerInfo> {
    const docker = await this.dockerClient.getClient();
    const container = docker.getContainer(containerId);
    const info = await container.inspect();

    return {
      id: info.Id,
      name: info.Name,
      state: info.State.Status,
      health: this.mapHealthStatus(info.State.Health?.Status),
      created: new Date(info.Created),
      ports: this.extractPorts(info),
      labels: info.Config.Labels || {},
    };
  }

  async listAFKContainers(): Promise<ContainerInfo[]> {
    const docker = await this.dockerClient.getClient();
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: ['afk.managed=true'],
      },
    });

    return containers.map(this.mapContainerInfo);
  }

  async getContainerStats(containerId: string): Promise<ContainerStats> {
    const docker = await this.dockerClient.getClient();
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });

    return {
      cpu: this.calculateCpuPercent(stats),
      memory: this.calculateMemoryUsage(stats),
      network: this.extractNetworkStats(stats),
    };
  }

  private mapHealthStatus(status: string | undefined): ContainerHealth {
    if (!status) {
      return ContainerHealth.UNKNOWN;
    }

    const mapped = Object.values(ContainerHealth).find(
      (value) => value === status,
    );
    return mapped ?? ContainerHealth.UNKNOWN;
  }

  private extractPorts(
    info: Dockerode.ContainerInspectInfo,
  ): Record<string, number> | null {
    const ports = info.NetworkSettings?.Ports;
    if (!ports) {
      return null;
    }

    const result: Record<string, number> = {};
    for (const [key, bindings] of Object.entries(ports)) {
      const hostPort = bindings?.[0]?.HostPort;
      if (hostPort) {
        result[key] = parseInt(hostPort, 10);
      }
    }

    return result;
  }

  private readonly mapContainerInfo = (
    container: Dockerode.ContainerInfo,
  ): ContainerInfo => ({
    id: container.Id,
    name: container.Names[0]?.replace('/', '') || '',
    state: container.State,
    health: this.mapHealthStatus(container.Status),
    created: new Date(container.Created * 1000),
    ports: container.Ports ? this.mapPorts(container.Ports) : null,
    labels: container.Labels || {},
  });

  private mapPorts(ports: Dockerode.Port[]): Record<string, number> {
    const result: Record<string, number> = {};
    ports.forEach((port) => {
      if (port.PublicPort) {
        result[`${port.PrivatePort}/${port.Type}`] = port.PublicPort;
      }
    });

    return result;
  }

  private calculateCpuPercent(stats: Dockerode.ContainerStats): number {
    const cpuDelta =
      stats.cpu_stats.cpu_usage.total_usage -
      stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta =
      stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const onlineCpus = stats.cpu_stats.online_cpus || 1;

    if (systemDelta > 0 && cpuDelta >= 0) {
      return (cpuDelta / systemDelta) * onlineCpus * 100;
    }

    return 0;
  }

  private calculateMemoryUsage(stats: Dockerode.ContainerStats): {
    used: number;
    total: number;
    percentage: number;
  } {
    const used = stats.memory_stats?.usage || 0;
    const total = stats.memory_stats?.limit || 0;

    return {
      used,
      total,
      percentage: total > 0 ? (used / total) * 100 : 0,
    };
  }

  private extractNetworkStats(stats: Dockerode.ContainerStats): {
    rx: number;
    tx: number;
  } {
    return {
      rx: stats.networks?.eth0?.rx_bytes || 0,
      tx: stats.networks?.eth0?.tx_bytes || 0,
    };
  }
}
