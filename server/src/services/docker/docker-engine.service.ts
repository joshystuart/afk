import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { DockerOptions } from 'dockerode';
import { PassThrough } from 'stream';
import { ContainerNotFoundError } from './container-not-found.error';
import {
  ContainerCreateOptions,
  ContainerHealth,
  ContainerInfo,
  ContainerStats,
  EphemeralContainerCreateOptions,
} from '../../domain/containers/container.entity';
import { PortPairDto } from '../../domain/containers/port-pair.dto';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';

function isErrorWithStatusCode(
  error: unknown,
): error is Error & { statusCode: number; reason?: string } {
  return error instanceof Error && 'statusCode' in error;
}

const WORKSPACE_BASE_PATH = '/workspace';
const DEFAULT_REPO_NAME = 'workspace';
const DEFAULT_EXEC_WORKING_DIR = `${WORKSPACE_BASE_PATH}/repo`;

@Injectable()
export class DockerEngineService implements OnModuleInit {
  private docker!: Dockerode;
  private currentSocketPath!: string;
  private readonly logger = new Logger(DockerEngineService.name);

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.getDockerClient();
  }

  private async getDockerClient(): Promise<Dockerode> {
    const settings = await this.settingsRepository.get();
    const socketPath = settings.docker.socketPath;
    if (!this.docker || socketPath !== this.currentSocketPath) {
      this.docker = this.createDockerClient(socketPath);
      this.currentSocketPath = socketPath;
    }
    return this.docker;
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

      const docker = await this.getDockerClient();
      const container = await docker.createContainer({
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

      return container;
    } catch (error: unknown) {
      this.logger.error('Failed to create container', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Container creation failed: ${message}`);
    }
  }

  async createEphemeralContainer(
    options: EphemeralContainerCreateOptions,
  ): Promise<Dockerode.Container> {
    this.logger.log('Creating ephemeral container for job run', {
      jobId: options.jobId,
      runId: options.runId,
      repoUrl: options.repoUrl,
      branch: options.branch,
    });

    try {
      await this.ping();
      await this.ensureImageAvailable(options.imageName);

      const docker = await this.getDockerClient();
      const container = await docker.createContainer({
        Image: options.imageName,
        Env: this.buildEphemeralEnvironment(options),
        ExposedPorts: this.buildExposedPorts(options.ports),
        HostConfig: {
          PortBindings: this.buildPortBindings(options.ports),
          RestartPolicy: { Name: 'no' },
        },
        Labels: {
          'afk.job.id': options.jobId,
          'afk.job.run.id': options.runId,
          'afk.managed': 'true',
        },
      });

      await container.start();
      return container;
    } catch (error: unknown) {
      this.logger.error('Failed to create ephemeral container', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Ephemeral container creation failed: ${message}`);
    }
  }

  private buildEphemeralEnvironment(
    options: EphemeralContainerCreateOptions,
  ): string[] {
    const env = [
      `REPO_URL=${options.repoUrl}`,
      `REPO_BRANCH=${options.branch}`,
      `GIT_USER_NAME=${options.gitUserName}`,
      `GIT_USER_EMAIL=${options.gitUserEmail}`,
      `TERMINAL_PORT=${options.ports.port}`,
      `SESSION_NAME=job-${options.runId.substring(0, 8)}`,
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

  private async ensureImageAvailable(imageName: string): Promise<void> {
    try {
      const docker = await this.getDockerClient();
      await docker.getImage(imageName).inspect();
    } catch (error: unknown) {
      if (!isErrorWithStatusCode(error) || error.statusCode !== 404) {
        throw error;
      }

      this.logger.log('Image not found locally, pulling', { imageName });
      await this.pullImage(imageName);
    }
  }

  private async pullImage(imageName: string): Promise<void> {
    const docker = await this.getDockerClient();
    await new Promise<void>((resolve, reject) => {
      docker.pull(
        imageName,
        (pullError: Error | null, stream: NodeJS.ReadableStream) => {
          if (pullError) {
            reject(pullError);
            return;
          }

          docker.modem.followProgress(
            stream,
            (progressError: Error | null) => {
              if (progressError) {
                reject(progressError);
                return;
              }

              this.logger.log('Image pulled successfully', { imageName });
              resolve();
            },
            (event: { status?: string }) => {
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
      const docker = await this.getDockerClient();
      const container = docker.getContainer(containerId);
      await container.stop({ t: 10 });
    } catch (error: unknown) {
      if (!isErrorWithStatusCode(error) || error.statusCode !== 304) {
        throw error;
      }
    }
  }

  async startContainer(containerId: string): Promise<void> {
    try {
      const docker = await this.getDockerClient();
      const container = docker.getContainer(containerId);
      await container.start();
    } catch (error: unknown) {
      if (!isErrorWithStatusCode(error) || error.statusCode !== 304) {
        throw error;
      }
    }
  }

  async removeContainer(containerId: string): Promise<void> {
    try {
      const docker = await this.getDockerClient();
      const container = docker.getContainer(containerId);
      await container.remove({ force: true });
    } catch (error: unknown) {
      if (
        isErrorWithStatusCode(error) &&
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
      const docker = await this.getDockerClient();
      const volume = docker.getVolume(volumeName);
      await volume.remove();
      this.logger.log(`Volume removed: ${volumeName}`);
    } catch (error: unknown) {
      if (isErrorWithStatusCode(error) && error.statusCode === 404) {
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
    const docker = await this.getDockerClient();
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
    const docker = await this.getDockerClient();
    const containers = await docker.listContainers({
      all: true,
      filters: {
        label: ['afk.managed=true'],
      },
    });

    return containers.map(this.mapContainerInfo);
  }

  async getContainerStats(containerId: string): Promise<ContainerStats> {
    const docker = await this.getDockerClient();
    const container = docker.getContainer(containerId);
    const stream = await container.stats({ stream: false });

    return {
      cpu: this.calculateCpuPercent(stream),
      memory: this.calculateMemoryUsage(stream),
      network: this.extractNetworkStats(stream),
    };
  }

  /**
   * Opens a raw follow stream for container logs. Lifecycle (including exactly
   * one follower per session) is owned by ContainerLogStreamService.
   */
  async openContainerFollowLogStream(
    containerId: string,
  ): Promise<NodeJS.ReadableStream> {
    const docker = await this.getDockerClient();
    const container = docker.getContainer(containerId);
    return await container.logs({
      stdout: true,
      stderr: true,
      follow: true,
      tail: 1000,
    });
  }

  async execInContainer(
    containerId: string,
    cmd: string[],
    workingDir = DEFAULT_EXEC_WORKING_DIR,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const docker = await this.getDockerClient();
    const container = docker.getContainer(containerId);

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

      const stdoutPassthrough = new PassThrough();
      const stderrPassthrough = new PassThrough();

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
    const docker = await this.getDockerClient();
    const container = docker.getContainer(containerId);

    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
      WorkingDir: workingDir,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    const stdoutPassthrough = new PassThrough();
    const stderrPassthrough = new PassThrough();

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
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn('Error killing exec stream', {
          containerId,
          error: message,
        });
      }
    };

    return { stream: stdoutPassthrough, kill };
  }

  async waitForContainerReady(
    containerId: string,
    options?: { maxWaitMs?: number; pollMs?: number },
  ): Promise<void> {
    const maxWaitMs = options?.maxWaitMs ?? 120_000;
    const pollMs = options?.pollMs ?? 2_000;
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      const info = await this.getContainerInfo(containerId);
      if (info.state === 'running') {
        break;
      }
      if (info.state === 'exited' || info.state === 'dead') {
        throw new Error(
          `Container ${containerId} exited unexpectedly (state: ${info.state})`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }

    let unhealthyCount = 0;
    const maxUnhealthyBeforeFail = 3;

    while (Date.now() < deadline) {
      const info = await this.getContainerInfo(containerId);

      if (info.state === 'exited' || info.state === 'dead') {
        throw new Error(
          `Container ${containerId} exited during health check (state: ${info.state})`,
        );
      }

      if (info.health === ContainerHealth.HEALTHY) {
        return;
      }
      if (info.health === ContainerHealth.UNHEALTHY) {
        unhealthyCount++;
        this.logger.warn('Container reported unhealthy, retrying', {
          containerId,
          unhealthyCount,
          maxUnhealthyBeforeFail,
        });
        if (unhealthyCount >= maxUnhealthyBeforeFail) {
          throw new Error(`Container ${containerId} reported unhealthy`);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, pollMs));
    }

    throw new Error(
      `Container ${containerId} did not become ready within ${maxWaitMs / 1000}s`,
    );
  }

  async isContainerReady(containerId: string): Promise<boolean> {
    const info = await this.getContainerInfo(containerId);
    return info.state === 'running' && info.health === ContainerHealth.HEALTHY;
  }

  async ping(): Promise<void> {
    try {
      const docker = await this.getDockerClient();
      await docker.ping();
    } catch (error: unknown) {
      this.logger.error('Docker ping failed', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Cannot connect to Docker daemon: ${message}`);
    }
  }

  async waitForDockerReady(options?: {
    maxWaitMs?: number;
    initialDelayMs?: number;
  }): Promise<void> {
    const maxWaitMs = options?.maxWaitMs ?? 60_000;
    const initialDelayMs = options?.initialDelayMs ?? 1_000;
    const deadline = Date.now() + maxWaitMs;
    let delayMs = initialDelayMs;
    let attempt = 0;

    while (Date.now() < deadline) {
      attempt++;
      try {
        await this.ping();
        const docker = await this.getDockerClient();
        await docker.listContainers({ limit: 1 });
        if (attempt > 1) {
          this.logger.log('Docker daemon is ready', { attempts: attempt });
        }
        return;
      } catch {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) break;

        this.logger.warn('Docker not ready, retrying', {
          attempt,
          nextRetryMs: Math.min(delayMs, remainingMs),
        });
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(delayMs, remainingMs)),
        );
        delayMs = Math.min(delayMs * 2, 10_000);
      }
    }

    throw new Error(
      `Docker daemon did not become ready within ${maxWaitMs / 1000}s`,
    );
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

  private buildExposedPorts(
    ports: PortPairDto,
  ): Record<string, Record<string, never>> {
    return {
      [`${ports.port}/tcp`]: {},
    };
  }

  private buildPortBindings(
    ports: PortPairDto,
  ): Record<string, Array<{ HostPort: string }>> {
    return {
      [`${ports.port}/tcp`]: [{ HostPort: ports.port.toString() }],
    };
  }

  private mapHealthStatus(status: string | undefined): ContainerHealth {
    if (!status) return ContainerHealth.UNKNOWN;

    const mapped = Object.values(ContainerHealth).find((v) => v === status);
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

  private mapContainerInfo = (
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
