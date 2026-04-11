import { Injectable, Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import {
  ContainerCreateOptions,
  EphemeralContainerCreateOptions,
} from '../../domain/containers/container.entity';
import { PortPairDto } from '../../domain/containers/port-pair.dto';
import { DEFAULT_REPO_NAME, WORKSPACE_BASE_PATH } from './docker.constants';
import { DockerClientService } from './docker-client.service';
import { DockerImageRuntimeService } from './docker-image-runtime.service';

@Injectable()
export class DockerContainerProvisioningService {
  private readonly logger = new Logger(DockerContainerProvisioningService.name);

  constructor(
    private readonly dockerClient: DockerClientService,
    private readonly dockerImageRuntime: DockerImageRuntimeService,
  ) {}

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
      await this.dockerImageRuntime.ensureImageAvailable(options.imageName);

      const docker = await this.dockerClient.getClient();
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
            ...(options.skillsPath
              ? [`${options.skillsPath}:/home/afk/.skills:ro`]
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
      await this.dockerImageRuntime.ensureImageAvailable(options.imageName);

      const docker = await this.dockerClient.getClient();
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

  private buildEnvironment(options: ContainerCreateOptions): string[] {
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
