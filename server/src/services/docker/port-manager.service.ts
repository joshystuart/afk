import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as net from 'net';
import { AppConfig } from '../../libs/config/app.config';
import { PortPairDtoFactory } from '../../domain/containers/port-pair-dto.factory';
import { PortPairDto } from '../../domain/containers/port-pair.dto';
import { DockerEngineService } from './docker-engine.service';

@Injectable()
export class PortManagerService implements OnModuleInit {
  private allocatedPorts: Set<number> = new Set();
  private portPool: number[] = [];
  private readonly logger = new Logger(PortManagerService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly portPairFactory: PortPairDtoFactory,
    private readonly dockerEngine: DockerEngineService,
  ) {
    this.initializePortPool();
  }

  async onModuleInit() {
    await this.syncWithRunningContainers();
  }

  async allocatePortPair(): Promise<PortPairDto> {
    const claudePort = await this.allocatePort();

    try {
      const manualPort = await this.allocatePort();
      return this.portPairFactory.create(claudePort, manualPort);
    } catch (error) {
      // Rollback claude port allocation if manual port fails
      this.releasePort(claudePort);
      throw error;
    }
  }

  async releasePortPair(ports: PortPairDto): Promise<void> {
    this.releasePort(ports.claudePort);
    this.releasePort(ports.manualPort);
  }

  getAvailablePortCount(): number {
    return this.portPool.length - this.allocatedPorts.size;
  }

  isPortAvailable(port: number): boolean {
    return this.portPool.includes(port) && !this.allocatedPorts.has(port);
  }

  private async allocatePort(): Promise<number> {
    const availablePorts = this.portPool.filter(
      (port) => !this.allocatedPorts.has(port),
    );

    if (availablePorts.length === 0) {
      throw new Error('No available ports in pool');
    }

    // Try each candidate port and verify it's actually free on the host
    for (const port of availablePorts) {
      const isFree = await this.isPortFreeOnHost(port);
      if (isFree) {
        this.allocatedPorts.add(port);
        this.logger.debug('Port allocated', {
          port,
          allocated: this.allocatedPorts.size,
        });
        return port;
      }

      this.logger.warn(
        `Port ${port} is in use on host (by non-AFK process or orphaned container), skipping`,
      );
    }

    throw new Error(
      'No available ports - all ports in the pool are currently in use on the host',
    );
  }

  private releasePort(port: number): void {
    this.allocatedPorts.delete(port);
    this.logger.debug('Port released', {
      port,
      allocated: this.allocatedPorts.size,
    });
  }

  private initializePortPool(): void {
    for (
      let port = this.config.docker.startPort;
      port <= this.config.docker.endPort;
      port++
    ) {
      this.portPool.push(port);
    }
    this.logger.log(`Initialized port pool with ${this.portPool.length} ports`);
  }

  /**
   * Syncs the in-memory allocated ports set with ports actually in use
   * by running AFK-managed Docker containers. This handles the case where
   * the server restarts but containers from the previous run are still alive.
   */
  private async syncWithRunningContainers(): Promise<void> {
    try {
      const containers = await this.dockerEngine.listAFKContainers();
      let syncedPorts = 0;

      for (const container of containers) {
        if (container.state === 'running' && container.ports) {
          const hostPorts = Object.values(container.ports).filter(
            (port): port is number => typeof port === 'number',
          );

          for (const port of hostPorts) {
            if (
              this.portPool.includes(port) &&
              !this.allocatedPorts.has(port)
            ) {
              this.allocatedPorts.add(port);
              syncedPorts++;
            }
          }
        }
      }

      this.logger.log(
        `Port sync complete: ${syncedPorts} ports marked as in-use from ${containers.length} AFK container(s)`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to sync ports with running containers. Port allocation may conflict with existing containers.',
        error,
      );
    }
  }

  /**
   * Checks whether a port is actually free on the host by attempting
   * to bind a TCP server to it. This catches ports used by non-AFK
   * processes or orphaned containers not tracked in our state.
   */
  private isPortFreeOnHost(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          this.logger.warn(
            `Unexpected error checking port ${port}: ${err.message}`,
          );
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close(() => resolve(true));
      });

      server.listen(port, '0.0.0.0');
    });
  }
}
