import { Injectable, Logger } from '@nestjs/common';
import { ContainerHealth } from '../../domain/containers/container.entity';
import { DockerClientService } from './docker-client.service';
import { DockerContainerStateService } from './docker-container-state.service';

@Injectable()
export class DockerContainerReadinessService {
  private readonly logger = new Logger(DockerContainerReadinessService.name);

  constructor(
    private readonly dockerClient: DockerClientService,
    private readonly dockerContainerState: DockerContainerStateService,
  ) {}

  async ping(): Promise<void> {
    try {
      const docker = await this.dockerClient.getClient();
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
        const docker = await this.dockerClient.getClient();
        await docker.listContainers({ limit: 1 });
        if (attempt > 1) {
          this.logger.log('Docker daemon is ready', { attempts: attempt });
        }
        return;
      } catch {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) {
          break;
        }

        this.logger.warn('Docker not ready, retrying', {
          attempt,
          nextRetryMs: Math.min(delayMs, remainingMs),
        });
        await this.sleep(Math.min(delayMs, remainingMs));
        delayMs = Math.min(delayMs * 2, 10_000);
      }
    }

    throw new Error(
      `Docker daemon did not become ready within ${maxWaitMs / 1000}s`,
    );
  }

  async waitForContainerReady(
    containerId: string,
    options?: { maxWaitMs?: number; pollMs?: number },
  ): Promise<void> {
    const maxWaitMs = options?.maxWaitMs ?? 120_000;
    const pollMs = options?.pollMs ?? 2_000;
    const deadline = Date.now() + maxWaitMs;

    while (Date.now() < deadline) {
      const info =
        await this.dockerContainerState.getContainerInfo(containerId);
      if (info.state === 'running') {
        break;
      }
      if (info.state === 'exited' || info.state === 'dead') {
        throw new Error(
          `Container ${containerId} exited unexpectedly (state: ${info.state})`,
        );
      }
      await this.sleep(pollMs);
    }

    let unhealthyCount = 0;
    const maxUnhealthyBeforeFail = 3;

    while (Date.now() < deadline) {
      const info =
        await this.dockerContainerState.getContainerInfo(containerId);

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

      await this.sleep(pollMs);
    }

    throw new Error(
      `Container ${containerId} did not become ready within ${maxWaitMs / 1000}s`,
    );
  }

  async isContainerReady(containerId: string): Promise<boolean> {
    const info = await this.dockerContainerState.getContainerInfo(containerId);
    return info.state === 'running' && info.health === ContainerHealth.HEALTHY;
  }

  private async sleep(delayMs: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
}
