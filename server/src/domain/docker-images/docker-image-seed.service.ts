import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DockerImageRepository } from './docker-image.repository';
import { DockerImage } from './docker-image.entity';
import { DockerImageStatus } from './docker-image-status.enum';

interface BuiltInImage {
  name: string;
  image: string;
  isDefault: boolean;
}

const BUILT_IN_IMAGES: BuiltInImage[] = [
  { name: 'Node.js v24', image: 'afk-node:latest', isDefault: true },
  { name: 'Python v3.13', image: 'afk-python:latest', isDefault: false },
  { name: 'Go v1.26', image: 'afk-go:latest', isDefault: false },
  { name: 'Rust', image: 'afk-rust:latest', isDefault: false },
  { name: '.NET v10', image: 'afk-dotnet:latest', isDefault: false },
  { name: 'Java v21', image: 'afk-java:latest', isDefault: false },
];

@Injectable()
export class DockerImageSeedService implements OnModuleInit {
  private readonly logger = new Logger(DockerImageSeedService.name);

  constructor(private readonly repository: DockerImageRepository) {}

  async onModuleInit(): Promise<void> {
    await this.seedBuiltInImages();
  }

  private async seedBuiltInImages(): Promise<void> {
    for (const entry of BUILT_IN_IMAGES) {
      const existing = await this.repository.findByImage(entry.image);
      if (existing) {
        if (existing.name !== entry.name) {
          existing.name = entry.name;
          await this.repository.save(existing);
          this.logger.log(
            `Updated built-in image name: ${entry.name} (${entry.image})`,
          );
        }
        continue;
      }

      const image = new DockerImage({
        id: uuidv4(),
        name: entry.name,
        image: entry.image,
        isDefault: entry.isDefault,
        isBuiltIn: true,
        status: DockerImageStatus.AVAILABLE,
        errorMessage: null,
      });

      await this.repository.save(image);
      this.logger.log(`Seeded built-in image: ${entry.name} (${entry.image})`);
    }
  }
}
