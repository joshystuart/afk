import { Injectable, Logger } from '@nestjs/common';
import * as Dockerode from 'dockerode';
import { DockerImageRepository } from '../../domain/docker-images/docker-image.repository';
import { DockerImage } from '../../domain/docker-images/docker-image.entity';
import { DockerImageStatus } from '../../domain/docker-images/docker-image-status.enum';
import { DockerConfig } from '../../libs/config/docker.config';
import { DockerOptions } from 'dockerode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DockerImageService {
  private docker: Dockerode;
  private readonly logger = new Logger(DockerImageService.name);

  constructor(
    private readonly repository: DockerImageRepository,
    private readonly config: DockerConfig,
  ) {
    const dockerOptions: DockerOptions = {};
    if (config.socketPath.startsWith('unix://')) {
      dockerOptions.socketPath = config.socketPath.replace('unix://', '');
    } else {
      dockerOptions.socketPath = config.socketPath;
    }
    this.docker = new Dockerode(dockerOptions);
  }

  async listAll(): Promise<DockerImage[]> {
    return this.repository.findAll();
  }

  async findById(id: string): Promise<DockerImage | null> {
    return this.repository.findById(id);
  }

  async registerAndPull(name: string, image: string): Promise<DockerImage> {
    const existing = await this.repository.findByImage(image);
    if (existing) {
      throw new Error(`Image "${image}" is already registered`);
    }

    const dockerImage = new DockerImage({
      id: uuidv4(),
      name,
      image,
      isDefault: false,
      isBuiltIn: false,
      status: DockerImageStatus.PULLING,
      errorMessage: null,
    });

    await this.repository.save(dockerImage);

    this.pullImageAsync(dockerImage);

    return dockerImage;
  }

  async retryPull(id: string): Promise<DockerImage> {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }
    if (image.status === DockerImageStatus.PULLING) {
      throw new Error('Image is already being pulled');
    }

    image.markAsPulling();
    await this.repository.save(image);

    this.pullImageAsync(image);

    return image;
  }

  async deleteImage(id: string): Promise<void> {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }
    if (image.isBuiltIn) {
      throw new Error('Cannot delete a built-in image');
    }
    if (image.isDefault) {
      throw new Error(
        'Cannot delete the default image. Set another image as default first.',
      );
    }

    await this.repository.delete(id);
  }

  async setDefault(id: string): Promise<DockerImage> {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }
    if (image.status !== DockerImageStatus.AVAILABLE) {
      throw new Error('Only available images can be set as default');
    }

    await this.repository.clearDefault();
    image.setAsDefault();
    await this.repository.save(image);

    return image;
  }

  private pullImageAsync(dockerImage: DockerImage): void {
    this.logger.log(`Starting pull for image: ${dockerImage.image}`);

    this.docker.pull(dockerImage.image, (err: any, stream: any) => {
      if (err) {
        this.logger.error(`Pull failed for ${dockerImage.image}`, err);
        dockerImage.markAsError(err.message || 'Failed to pull image');
        this.repository.save(dockerImage).catch((saveErr) => {
          this.logger.error('Failed to save error status', saveErr);
        });
        return;
      }

      this.docker.modem.followProgress(
        stream,
        (progressErr: any) => {
          if (progressErr) {
            this.logger.error(
              `Pull progress error for ${dockerImage.image}`,
              progressErr,
            );
            dockerImage.markAsError(progressErr.message || 'Image pull failed');
          } else {
            this.logger.log(
              `Pull completed successfully for ${dockerImage.image}`,
            );
            dockerImage.markAsAvailable();
          }

          this.repository.save(dockerImage).catch((saveErr) => {
            this.logger.error('Failed to save pull result', saveErr);
          });
        },
        (event: any) => {
          if (event.status) {
            this.logger.debug(
              `Pull ${dockerImage.image}: ${event.status} ${event.progress || ''}`,
            );
          }
        },
      );
    });
  }
}
