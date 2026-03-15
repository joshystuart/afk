import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { ContainerNotFoundError } from './container-not-found.error';
import { DockerOptions } from 'dockerode';
import {
  ContainerCreateOptions,
  ContainerInfo,
  ContainerStats,
} from '../../domain/containers/container.entity';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';

const WORKSPACE_BASE_PATH = '/workspace';
const DEFAULT_REPO_NAME = 'workspace';
const DEFAULT_EXEC_WORKING_DIR = `${WORKSPACE_BASE_PATH}/repo`;

@Injectable()
export class DockerEngineService implements OnModuleInit {
  private docker!: Dockerode;
  private readonly logger = new Logger(DockerEngineService.name);

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    const settings = await this.settingsRepository.get();
    const socketPath = settings.docker.socketPath;
    this.docker = this.createDockerClient(socketPath);
  }

  private createDockerClient(socketPath: string): Dockerode {
    this.logger.log('Initializing Docker client', { socketPath });
    const dockerOptions: DockerOptions = {};
    if (socketPath.startsWith('unix://')) {
      dockerOptions.socketPath = socketPath.replace('unix://', '');
    } else {
      dockerOptions.socketPath = socketPath;
    }
    return new Dockerode(dockerOptions);
  }

  async createContainer(
    options: ContainerCreateOptions,
  ): Promise<Dockerode.Container> {
    this.logger.log('Creating container', {
      sessionId: options.sessionId,
      sessionName: options.sessionName,
      repoUrl: options.repoUrl,
      branch: options.branch,
      ports: options.ports,
    });

    try {
      // Verify Docker connectivity first
      await this.ping();
      await this.ensureImageAvailable(options.imageName);

      const container = await this.docker.createContainer({
        Image: options.imageName,
        Env: this.buildEnvironment(options),
        ExposedPorts: this.buildExposedPorts(options.ports),
        HostConfig: {
          PortBindings: this.buildPortBindings(options.ports),
          Binds: [
            `afk-tmux-${options.sessionId}:/home/afk/.tmux/resurrect`,
            `afk-claude-${options.sessionId}:/home/afk/.claude`,
            ...(options.hostMountPath
              ? [
                  `${options.hostMountPath}:${this.getContainerMountTarget(options.repoUrl)}:rw`,
                ]
              : []),
          ],
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

  private async ensureImageAvailable(imageName: string): Promise<void> {
    try {
      await this.docker.getImage(imageName).inspect();
    } catch (error: any) {
      if (error?.statusCode !== 404) {
        throw error;
      }

      this.logger.log('Image not found locally, pulling', { imageName });
      await this.pullImage(imageName);
    }
  }

  private async pullImage(imageName: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.docker.pull(
        imageName,
        (pullError: any, stream: NodeJS.ReadableStream) => {
          if (pullError) {
            reject(pullError);
            return;
          }

          this.docker.modem.followProgress(
            stream,
            (progressError: any) => {
              if (progressError) {
                reject(progressError);
                return;
              }

              this.logger.log('Image pulled successfully', { imageName });
              resolve();
            },
            (event: any) => {
              if (event?.status) {
                this.logger.debug(`Pull ${imageName}: ${event.status}`);
              }
            },
          );
        },
      );
    });
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
    try {
      const container = this.docker.getContainer(containerId);
      await container.remove({ force: true });
    } catch (error: any) {
      if (error?.statusCode === 404 && error?.reason === 'no such container') {
        throw new ContainerNotFoundError(containerId, error);
      }
      throw error;
    }
  }

  async removeVolume(volumeName: string): Promise<void> {
    try {
      const volume = this.docker.getVolume(volumeName);
      await volume.remove();
      this.logger.log(`Volume removed: ${volumeName}`);
    } catch (error: any) {
      if (error?.statusCode === 404) {
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

  async execInContainer(
    containerId: string,
    cmd: string[],
    workingDir = DEFAULT_EXEC_WORKING_DIR,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const container = this.docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: workingDir,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    return new Promise((resolve, reject) => {
      const stdoutBuffers: Buffer[] = [];
      const stderrBuffers: Buffer[] = [];

      // Dockerode multiplexes stdout/stderr into a single stream.
      // Use demuxStream to separate them.
      const stdoutPassthrough = new (require('stream').PassThrough)();
      const stderrPassthrough = new (require('stream').PassThrough)();

      container.modem.demuxStream(stream, stdoutPassthrough, stderrPassthrough);

      stdoutPassthrough.on('data', (chunk: Buffer) =>
        stdoutBuffers.push(chunk),
      );
      stderrPassthrough.on('data', (chunk: Buffer) =>
        stderrBuffers.push(chunk),
      );

      stream.on('end', async () => {
        try {
          const inspectResult = await exec.inspect();
          resolve({
            stdout: Buffer.concat(stdoutBuffers).toString('utf8').trim(),
            stderr: Buffer.concat(stderrBuffers).toString('utf8').trim(),
            exitCode: inspectResult.ExitCode ?? -1,
          });
        } catch (err) {
          reject(err);
        }
      });

      stream.on('error', reject);
    });
  }

  async execStreamInContainer(
    containerId: string,
    cmd: string[],
    onData: (data: string) => void,
    workingDir = DEFAULT_EXEC_WORKING_DIR,
  ): Promise<{ stream: NodeJS.ReadableStream; kill: () => Promise<void> }> {
    const container = this.docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: workingDir,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    const stdoutPassthrough = new (require('stream').PassThrough)();
    const stderrPassthrough = new (require('stream').PassThrough)();

    container.modem.demuxStream(stream, stdoutPassthrough, stderrPassthrough);

    stdoutPassthrough.on('data', (chunk: Buffer) => {
      onData(chunk.toString('utf8'));
    });

    stderrPassthrough.on('data', (chunk: Buffer) => {
      this.logger.debug('execStream stderr', chunk.toString('utf8'));
    });

    const kill = async () => {
      try {
        stream.destroy();
        stdoutPassthrough.destroy();
        stderrPassthrough.destroy();
      } catch (error) {
        this.logger.warn('Error killing exec stream', {
          containerId,
          error: error.message,
        });
      }
    };

    return { stream: stdoutPassthrough, kill };
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
      `TERMINAL_PORT=${options.ports.port}`,
      `SESSION_NAME=${options.sessionName}`,
      `IMAGE_NAME=${options.imageName}`,
      `CLAUDE_DANGEROUS_SKIP_PERMISSIONS=1`,
    ];

    if (options.sshPrivateKey) {
      env.push(`SSH_PRIVATE_KEY=${options.sshPrivateKey}`);
    }

    if (options.claudeToken) {
      env.push(`CLAUDE_CODE_OAUTH_TOKEN=${options.claudeToken}`);
    }

    if (options.githubToken) {
      env.push(`GITHUB_TOKEN=${options.githubToken}`);
    }

    return env;
  }

  private buildExposedPorts(ports: any): Record<string, {}> {
    return {
      [`${ports.port}/tcp`]: {},
    };
  }

  private buildPortBindings(
    ports: any,
  ): Record<string, Array<{ HostPort: string }>> {
    return {
      [`${ports.port}/tcp`]: [{ HostPort: ports.port.toString() }],
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

  private getContainerMountTarget(repoUrl?: string): string {
    if (!repoUrl) {
      return WORKSPACE_BASE_PATH;
    }

    const repoName = this.extractRepoName(repoUrl);
    return `${WORKSPACE_BASE_PATH}/${repoName}`;
  }

  private extractRepoName(repoUrl: string): string {
    const lastSegment = repoUrl.split(/[/:]/).pop() || DEFAULT_REPO_NAME;
    return lastSegment.replace(/\.git$/, '') || DEFAULT_REPO_NAME;
  }
}
