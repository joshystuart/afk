import { Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { AppConfig } from '../../libs/config/app.config';
import {
  ContainerCreateOptions,
  ContainerInfo,
  ContainerStats,
} from '../../domain/containers/container.entity';

export class DockerEngineService {
  private docker: Dockerode;
  private readonly logger = new Logger(DockerEngineService.name);

  constructor(private readonly config: AppConfig) {
    this.logger.log('Config received in DockerEngineService', {
      configExists: !!config,
      dockerExists: !!config?.docker,
      config: config,
    });

    const dockerOptions: any = {};
    dockerOptions.socketPath = config?.docker?.socketPath;

    this.docker = new Dockerode(dockerOptions);
    this.logger.log('Docker client initialized', { options: dockerOptions });
  }

  async createContainer(
    options: ContainerCreateOptions,
  ): Promise<Dockerode.Container> {
    this.logger.log('Creating container', { options });
    this.logger.log('Config at container creation', {
      configExists: !!this.config,
      dockerExists: !!this.config?.docker,
      imageName: this.config?.docker?.imageName,
    });

    try {
      // Verify Docker connectivity first
      await this.ping();

      const imageName = this.config?.docker?.imageName || 'afk:latest';

      const container = await this.docker.createContainer({
        Image: imageName,
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

      const logStream = await container.logs({
        follow: true,
        stdout: true,
        stderr: true,
        tail: 1000,
      });
      logStream.on('data', (chunk) => {
        this.logger.debug(
          `Container ${options.sessionId}`,
          chunk.toString('utf8'),
        );
      });
      logStream.on('end', () => {
        this.logger.debug(`Container ${options.sessionId} - Log stream ended.`);
      });
      logStream.on('error', (err) => {
        this.logger.debug(
          `Container ${options.sessionId} - Log stream error`,
          err,
        );
      });

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
      if (error.statusCode !== 304) {
        // Not modified (already stopped)
        throw error;
      }
    }
  }

  async startContainer(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.start();
    } catch (error) {
      if (error.statusCode !== 304) {
        // Not modified (already started)
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
    });

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
    // Don't convert URLs - let the container scripts handle URL format
    const repoUrl = options.repoUrl || '';

    const env = [
      `REPO_URL=${repoUrl}`,
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

  private convertToSshUrl(url: string): string {
    // Convert HTTPS GitHub/GitLab/Bitbucket URLs to SSH format
    const httpsPatterns = [
      {
        pattern: /^https:\/\/github\.com\/(.+)\/(.+?)(?:\.git)?$/,
        replacement: 'git@github.com:$1/$2.git',
      },
      {
        pattern: /^https:\/\/gitlab\.com\/(.+)\/(.+?)(?:\.git)?$/,
        replacement: 'git@gitlab.com:$1/$2.git',
      },
      {
        pattern: /^https:\/\/bitbucket\.org\/(.+)\/(.+?)(?:\.git)?$/,
        replacement: 'git@bitbucket.org:$1/$2.git',
      },
    ];

    for (const { pattern, replacement } of httpsPatterns) {
      if (pattern.test(url)) {
        const convertedUrl = url.replace(pattern, replacement);
        this.logger.log(
          `Converted HTTPS URL to SSH: ${url} -> ${convertedUrl}`,
        );
        return convertedUrl;
      }
    }

    // Return original URL if no conversion needed
    this.logger.log(
      `URL already in SSH format or not supported for conversion: ${url}`,
    );
    return url;
  }

  private buildExposedPorts(ports: any): Record<string, {}> {
    return {
      [`${ports.claudePort}/tcp`]: {},
      [`${ports.manualPort}/tcp`]: {},
    };
  }

  private buildPortBindings(
    ports: any,
  ): Record<string, Array<{ HostPort: string }>> {
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
    ports.forEach((port) => {
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

  private calculateMemoryUsage(stats: any): {
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

  private extractNetworkStats(stats: any): { rx: number; tx: number } {
    return {
      rx: stats.networks?.eth0?.rx_bytes || 0,
      tx: stats.networks?.eth0?.tx_bytes || 0,
    };
  }
}
