import { Inject, Injectable, Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { DockerOptions } from 'dockerode';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';

@Injectable()
export class DockerClientService {
  private docker?: Dockerode;
  private currentSocketPath?: string;
  private readonly logger = new Logger(DockerClientService.name);

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async getClient(): Promise<Dockerode> {
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

    const dockerOptions: DockerOptions = {
      socketPath: this.normalizeSocketPath(socketPath),
    };

    return new Dockerode(dockerOptions);
  }

  private normalizeSocketPath(socketPath: string): string {
    return socketPath.startsWith('unix://')
      ? socketPath.replace('unix://', '')
      : socketPath;
  }
}
