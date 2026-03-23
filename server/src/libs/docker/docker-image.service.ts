import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DockerImageRepository } from '../../domain/docker-images/docker-image.repository';
import { DockerImage } from '../../domain/docker-images/docker-image.entity';
import { DockerImageStatus } from '../../domain/docker-images/docker-image-status.enum';
import { v4 as uuidv4 } from 'uuid';
import { DockerClientService } from './docker-client.service';
import { DockerImageRuntimeService } from './docker-image-runtime.service';

@Injectable()
export class DockerImageService implements OnModuleInit {
  private readonly logger = new Logger(DockerImageService.name);

  constructor(
    private readonly repository: DockerImageRepository,
    private readonly dockerClient: DockerClientService,
    private readonly dockerImageRuntime: DockerImageRuntimeService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.dockerClient.getClient();
    await this.reconcileImageStatuses();
  }

  private async reconcileImageStatuses(): Promise<void> {
    const allImages = await this.repository.findAll();
    let changed = false;

    for (const image of allImages) {
      if (image.status === DockerImageStatus.PULLING) {
        continue;
      }

      const existsLocally = await this.imageExistsLocally(image.image);

      if (image.status === DockerImageStatus.AVAILABLE && !existsLocally) {
        if (image.isBuiltIn) {
          this.logger.warn(
            `Built-in image "${image.image}" no longer found locally — resetting to NOT_PULLED`,
          );
          image.markAsNotPulled();
        } else {
          this.logger.warn(
            `Custom image "${image.image}" no longer found locally — marking as ERROR`,
          );
          image.markAsError(
            'Image was removed outside of AFK. Re-install or delete this entry.',
          );
        }
        await this.repository.save(image);
        changed = true;
      } else if (
        (image.status === DockerImageStatus.NOT_PULLED ||
          image.status === DockerImageStatus.ERROR) &&
        existsLocally
      ) {
        this.logger.log(
          `Image "${image.image}" found locally — marking as AVAILABLE`,
        );
        image.markAsAvailable();
        await this.repository.save(image);
        changed = true;
      }
    }

    if (changed || !(await this.repository.findDefault())) {
      const refreshed = await this.repository.findAll();
      const hasDefault = refreshed.some((img) => img.isDefault);
      if (!hasDefault) {
        const firstAvailable = refreshed.find(
          (img) => img.status === DockerImageStatus.AVAILABLE,
        );
        if (firstAvailable) {
          this.logger.log(
            `No default image set — defaulting to "${firstAvailable.image}"`,
          );
          firstAvailable.setAsDefault();
          await this.repository.save(firstAvailable);
        }
      }
    }
  }

  private async imageExistsLocally(imageName: string): Promise<boolean> {
    return this.dockerImageRuntime.imageExistsLocally(imageName);
  }

  async listAll(): Promise<DockerImage[]> {
    await this.reconcileImageStatuses();
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

    if (await this.imageExistsLocally(image.image)) {
      this.logger.log(
        `Image "${image.image}" already exists locally — skipping pull`,
      );
      image.markAsAvailable();
      if (!(await this.repository.findDefault())) {
        image.setAsDefault();
      }
      await this.repository.save(image);
      return image;
    }

    image.markAsPulling();
    await this.repository.save(image);

    this.pullImageAsync(image);

    return image;
  }

  async installImage(id: string): Promise<DockerImage> {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }
    if (image.status !== DockerImageStatus.NOT_PULLED) {
      throw new Error('Image is already installed or being pulled');
    }

    if (await this.imageExistsLocally(image.image)) {
      this.logger.log(
        `Image "${image.image}" already exists locally — skipping pull`,
      );
      image.markAsAvailable();
      if (!(await this.repository.findDefault())) {
        image.setAsDefault();
      }
      await this.repository.save(image);
      return image;
    }

    image.markAsPulling();
    await this.repository.save(image);

    this.pullImageAsync(image).then(async () => {
      const refreshed = await this.repository.findById(id);
      if (
        refreshed &&
        refreshed.status === DockerImageStatus.AVAILABLE &&
        !(await this.repository.findDefault())
      ) {
        refreshed.setAsDefault();
        await this.repository.save(refreshed);
      }
    });

    return image;
  }

  async deleteImage(id: string): Promise<void> {
    const image = await this.repository.findById(id);
    if (!image) {
      throw new Error('Image not found');
    }
    if (image.isDefault) {
      throw new Error(
        'Cannot delete the default image. Set another image as default first.',
      );
    }

    if (image.isBuiltIn) {
      image.markAsNotPulled();
      await this.repository.save(image);
      this.tryRemoveLocalImage(image.image);
      return;
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

  private async pullImageAsync(dockerImage: DockerImage): Promise<void> {
    this.logger.log(`Starting pull for image: ${dockerImage.image}`);

    try {
      await this.dockerImageRuntime.pullImage(dockerImage.image);
      this.logger.log(`Pull completed successfully for ${dockerImage.image}`);
      dockerImage.markAsAvailable();
    } catch (error) {
      this.logger.error(`Pull failed for ${dockerImage.image}`, error);
      dockerImage.markAsError(
        error instanceof Error ? error.message : 'Failed to pull image',
      );
    }

    await this.repository.save(dockerImage).catch((saveErr) => {
      this.logger.error('Failed to save pull result', saveErr);
    });
  }

  private tryRemoveLocalImage(imageName: string): void {
    this.dockerClient
      .getClient()
      .then((docker) => docker.getImage(imageName).remove())
      .catch((err: any) => {
        this.logger.warn(
          `Could not remove local image ${imageName}: ${err.message}`,
        );
      });
  }
}
