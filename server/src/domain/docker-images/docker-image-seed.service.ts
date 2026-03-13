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
  { name: 'Node.js', image: 'afk-node:latest', isDefault: true },
  { name: 'Python', image: 'afk-python:latest', isDefault: false },
  { name: 'Go', image: 'afk-go:latest', isDefault: false },
  { name: 'Rust', image: 'afk-rust:latest', isDefault: false },
  { name: '.NET', image: 'afk-dotnet:latest', isDefault: false },
  { name: 'Java', image: 'afk-java:latest', isDefault: false },
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
