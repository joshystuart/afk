import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppConfig } from '../../libs/config/app.config';
import { PortPairDtoFactory } from '../../domain/containers/port-pair-dto.factory';
import { PortPairDto } from '../../domain/containers/port-pair.dto';

@Injectable()
export class PortManagerService implements OnModuleInit {
  private allocatedPorts: Set<number> = new Set();
  private portPool: number[] = [];
  private readonly logger = new Logger(PortManagerService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly portPairFactory: PortPairDtoFactory,
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
      port => !this.allocatedPorts.has(port)
    );

    if (availablePorts.length === 0) {
      throw new Error('No available ports in pool');
    }

    const port = availablePorts[0];
    this.allocatedPorts.add(port);
    
    this.logger.debug('Port allocated', { port, allocated: this.allocatedPorts.size });
    return port;
  }

  private releasePort(port: number): void {
    this.allocatedPorts.delete(port);
    this.logger.debug('Port released', { port, allocated: this.allocatedPorts.size });
  }

  private initializePortPool(): void {
    for (let port = this.config.docker.startPort; port <= this.config.docker.endPort; port++) {
      this.portPool.push(port);
    }
    this.logger.log(`Initialized port pool with ${this.portPool.length} ports`);
  }

  private async syncWithRunningContainers(): Promise<void> {
    // In a real implementation, we would sync with running containers
    // For now, we'll just log this step
    this.logger.log('Port synchronization with running containers completed');
  }
}