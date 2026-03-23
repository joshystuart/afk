import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import * as net from 'net';
import { PortPairDtoFactory } from '../../domain/containers/port-pair-dto.factory';
import { PortPairDto } from '../../domain/containers/port-pair.dto';
import { DockerEngineService } from './docker-engine.service';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';

@Injectable()
export class PortManagerService implements OnModuleInit {
  private readonly allocatedPorts: Set<number> = new Set();
  private readonly logger = new Logger(PortManagerService.name);

  constructor(
    private readonly portPairFactory: PortPairDtoFactory,
    private readonly dockerEngine: DockerEngineService,
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async onModuleInit() {
    await this.syncWithRunningContainers();
  }

  async allocatePortPair(): Promise<PortPairDto> {
    const port = await this.allocatePort();
    return this.portPairFactory.create(port);
  }

  async releasePortPair(ports: PortPairDto): Promise<void> {
    this.releasePort(ports.port);
  }

  async getAvailablePortCount(): Promise<number> {
    const range = await this.getPortRange();
    return range.length - this.allocatedPorts.size;
  }

  async isPortAvailable(port: number): Promise<boolean> {
    const { startPort, endPort } = await this.getPortRangeBounds();
    return (
      port >= startPort && port <= endPort && !this.allocatedPorts.has(port)
    );
  }

  private async getPortRangeBounds(): Promise<{
    startPort: number;
    endPort: number;
  }> {
    const settings = await this.settingsRepository.get();
    return {
      startPort: settings.docker.startPort,
      endPort: settings.docker.endPort,
    };
  }

  private async getPortRange(): Promise<number[]> {
    const { startPort, endPort } = await this.getPortRangeBounds();
    const ports: number[] = [];
    for (let port = startPort; port <= endPort; port++) {
      ports.push(port);
    }
    return ports;
  }

  private async allocatePort(): Promise<number> {
    const range = await this.getPortRange();
    const availablePorts = range.filter(
      (port) => !this.allocatedPorts.has(port),
    );

    if (availablePorts.length === 0) {
      throw new Error('No available ports in pool');
    }

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

  private async syncWithRunningContainers(): Promise<void> {
    try {
      const { startPort, endPort } = await this.getPortRangeBounds();
      const containers = await this.dockerEngine.listAFKContainers();
      let syncedPorts = 0;

      for (const container of containers) {
        if (container.state === 'running' && container.ports) {
          const hostPorts = Object.values(container.ports).filter(
            (port): port is number => typeof port === 'number',
          );

          for (const port of hostPorts) {
            if (
              port >= startPort &&
              port <= endPort &&
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
