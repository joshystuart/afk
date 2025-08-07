import { Injectable, Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { DockerConfig } from '../../libs/config/docker.config';
import { ContainerInfo, ContainerStats, ContainerCreateOptions } from '../../domain/containers/container.entity';

export class DockerEngineService {
  private docker: Dockerode;
  private readonly logger = new Logger(DockerEngineService.name);

  constructor(private readonly config: DockerConfig) {
    // Use DOCKER_HOST if set, otherwise fall back to config socketPath
    const dockerOptions: any = {};
    
    if (process.env.DOCKER_HOST) {
      if (process.env.DOCKER_HOST.startsWith('unix://')) {
        dockerOptions.socketPath = process.env.DOCKER_HOST.replace('unix://', '');
      } else {
        // For TCP connections
        dockerOptions.host = process.env.DOCKER_HOST;
      }
    } else {
      dockerOptions.socketPath = config.socketPath;
    }

    this.docker = new Dockerode(dockerOptions);
    this.logger.log('Docker client initialized', { options: dockerOptions });
  }

  async createContainer(options: ContainerCreateOptions): Promise<Dockerode.Container> {
    this.logger.log('Creating container', { options });
    
    try {
      // Verify Docker connectivity first
      await this.ping();
      
      const container = await this.docker.createContainer({
        Image: this.config.imageName,
        Env: this.buildEnvironment(options),
        ExposedPorts: this.buildExposedPorts(options.ports),
        HostConfig: {
          PortBindings: this.buildPortBindings(options.ports),
          Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
          Privileged: true,
          RestartPolicy: { Name: 'unless-stopped' },
        },
        Labels: {
          'afk.session.id': options.sessionId,
          'afk.session.name': options.sessionName,
          'afk.managed': 'true',
        },
      });

      await container.start();
      return container;
    } catch (error) {
      this.logger.error('Failed to create container', error);
      throw new Error(`Container creation failed: ${error.message}`);
    }
  }

  async stopContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop({ t: 10 });
    } catch (error) {
      if ((error as any).statusCode !== 304) { // Not modified (already stopped)
        throw error;
      }
    }
  }

  async removeContainer(containerId: string): Promise<void> {
    const container = this.docker.getContainer(containerId);
    await container.remove({ force: true });
  }

  async getContainerInfo(containerId: string): Promise<ContainerInfo> {
    const container = this.docker.getContainer(containerId);
    const info = await container.inspect();
    
    return {
      id: info.Id,
      name: info.Name,
      state: info.State.Status,
      created: new Date(info.Created),
      ports: this.extractPorts(info),
      labels: info.Config.Labels || {},
    };
  }

  async listAFKContainers(): Promise<ContainerInfo[]> {
    const containers = await this.docker.listContainers({
      all: true,
      filters: {
        label: ['afk.managed=true'],
      },
    });

    return containers.map(this.mapContainerInfo);
  }

  async getContainerStats(containerId: string): Promise<ContainerStats> {
    const container = this.docker.getContainer(containerId);
    const stream = await container.stats({ stream: false });
    
    return {
      cpu: this.calculateCpuPercent(stream),
      memory: this.calculateMemoryUsage(stream),
      network: this.extractNetworkStats(stream),
    };
  }

  async streamContainerLogs(
    containerId: string,
    onData: (log: string) => void,
  ): Promise<NodeJS.ReadableStream> {
    const container = this.docker.getContainer(containerId);
    const stream = await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 100,
    }) as NodeJS.ReadableStream;

    stream.on('data', (chunk) => {
      onData(chunk.toString());
    });

    return stream;
  }

  async ping(): Promise<void> {
    try {
      await this.docker.ping();
    } catch (error) {
      this.logger.error('Docker ping failed', error);
      throw new Error(`Cannot connect to Docker daemon: ${error.message}`);
    }
  }

  private buildEnvironment(options: ContainerCreateOptions): string[] {
    const env = [
      `REPO_URL=${options.repoUrl || ''}`,
      `REPO_BRANCH=${options.branch || 'main'}`,
      `GIT_USER_NAME=${options.gitUserName}`,
      `GIT_USER_EMAIL=${options.gitUserEmail}`,
      `TERMINAL_MODE=${options.terminalMode}`,
      `CLAUDE_PORT=${options.ports.claudePort}`,
      `MANUAL_PORT=${options.ports.manualPort}`,
    ];

    if (options.sshPrivateKey) {
      env.push(`SSH_PRIVATE_KEY=${options.sshPrivateKey}`);
    }

    if (options.claudeToken) {
      env.push(`CLAUDE_CODE_OAUTH_TOKEN=${options.claudeToken}`);
    }

    return env;
  }

  private buildExposedPorts(ports: any): Record<string, {}> {
    return {
      [`${ports.claudePort}/tcp`]: {},
      [`${ports.manualPort}/tcp`]: {},
    };
  }

  private buildPortBindings(ports: any): Record<string, Array<{ HostPort: string }>> {
    return {
      [`${ports.claudePort}/tcp`]: [{ HostPort: ports.claudePort.toString() }],
      [`${ports.manualPort}/tcp`]: [{ HostPort: ports.manualPort.toString() }],
    };
  }

  private extractPorts(info: any): Record<string, any> | null {
    if (!info.NetworkSettings || !info.NetworkSettings.Ports) {
      return null;
    }
    return info.NetworkSettings.Ports;
  }

  private mapContainerInfo = (container: any): ContainerInfo => ({
    id: container.Id,
    name: container.Names[0]?.replace('/', '') || '',
    state: container.State,
    created: new Date(container.Created * 1000),
    ports: container.Ports ? this.mapPorts(container.Ports) : null,
    labels: container.Labels || {},
  });

  private mapPorts(ports: any[]): Record<string, any> {
    const result: Record<string, any> = {};
    ports.forEach(port => {
      if (port.PublicPort) {
        result[`${port.PrivatePort}/${port.Type}`] = port.PublicPort;
      }
    });
    return result;
  }

  private calculateCpuPercent(stats: any): number {
    // Basic CPU calculation - would need more sophisticated logic for production
    return 0;
  }

  private calculateMemoryUsage(stats: any): { used: number; total: number; percentage: number } {
    const used = stats.memory_stats?.usage || 0;
    const total = stats.memory_stats?.limit || 0;
    return {
      used,
      total,
      percentage: total > 0 ? (used / total) * 100 : 0,
    };
  }

  private extractNetworkStats(stats: any): { rx: number; tx: number } {
    return {
      rx: stats.networks?.eth0?.rx_bytes || 0,
      tx: stats.networks?.eth0?.tx_bytes || 0,
    };
  }
}