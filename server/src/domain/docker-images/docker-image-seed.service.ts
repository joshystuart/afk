import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DockerImageRepository } from './docker-image.repository';
import { DockerImage } from './docker-image.entity';
import { DockerImageStatus } from './docker-image-status.enum';

interface BuiltInImage {
  name: string;
  image: string;
}

const BUILT_IN_IMAGES: BuiltInImage[] = [
  { name: 'Node.js v24', image: 'awayfromklaude/afk-node:latest' },
  { name: 'Python v3.13', image: 'awayfromklaude/afk-python:latest' },
  { name: 'Go v1.26', image: 'awayfromklaude/afk-go:latest' },
  { name: 'Rust', image: 'awayfromklaude/afk-rust:latest' },
  { name: '.NET v10', image: 'awayfromklaude/afk-dotnet:latest' },
  { name: 'Java v21', image: 'awayfromklaude/afk-java:latest' },
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
        const hasChanges =
          existing.name !== entry.name ||
          existing.image !== entry.image ||
          existing.isBuiltIn !== true;

        if (hasChanges) {
          existing.name = entry.name;
          existing.image = entry.image;
          existing.isBuiltIn = true;
          await this.repository.save(existing);
          this.logger.log(
            `Updated built-in image metadata: ${entry.name} (${entry.image})`,
          );
        }
        continue;
      }

      const image = new DockerImage({
        id: uuidv4(),
        name: entry.name,
        image: entry.image,
        isDefault: false,
        isBuiltIn: true,
        status: DockerImageStatus.NOT_PULLED,
        errorMessage: null,
      });

      await this.repository.save(image);
      this.logger.log(`Seeded built-in image: ${entry.name} (${entry.image})`);
    }
  }
}
