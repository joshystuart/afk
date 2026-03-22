import { Injectable, Logger } from '@nestjs/common';
import { DockerClientService } from './docker-client.service';
import { isDockerStatusCodeError } from './docker-error.utils';

@Injectable()
export class DockerImageRuntimeService {
  private readonly logger = new Logger(DockerImageRuntimeService.name);

  constructor(private readonly dockerClient: DockerClientService) {}

  async imageExistsLocally(imageName: string): Promise<boolean> {
    try {
      const docker = await this.dockerClient.getClient();
      await docker.getImage(imageName).inspect();
      return true;
    } catch {
      return false;
    }
  }

  async ensureImageAvailable(imageName: string): Promise<void> {
    try {
      const docker = await this.dockerClient.getClient();
      await docker.getImage(imageName).inspect();
    } catch (error: unknown) {
      if (!isDockerStatusCodeError(error) || error.statusCode !== 404) {
        throw error;
      }

      this.logger.log('Image not found locally, pulling', { imageName });
      await this.pullImage(imageName);
    }
  }

  async pullImage(imageName: string): Promise<void> {
    const docker = await this.dockerClient.getClient();

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
}
