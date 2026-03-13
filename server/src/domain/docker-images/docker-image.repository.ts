import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DockerImage } from './docker-image.entity';

@Injectable()
export class DockerImageRepository {
  constructor(
    @InjectRepository(DockerImage)
    private readonly repository: Repository<DockerImage>,
  ) {}

  async save(image: DockerImage): Promise<void> {
    await this.repository.save(image);
  }

  async findById(id: string): Promise<DockerImage | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<DockerImage[]> {
    return this.repository.find({ order: { name: 'ASC' } });
  }

  async findDefault(): Promise<DockerImage | null> {
    return this.repository.findOne({ where: { isDefault: true } });
  }

  async findByImage(image: string): Promise<DockerImage | null> {
    return this.repository.findOne({ where: { image } });
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async count(): Promise<number> {
    return this.repository.count();
  }

  async clearDefault(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(DockerImage)
      .set({ isDefault: false })
      .where('isDefault = :isDefault', { isDefault: true })
      .execute();
  }
}
