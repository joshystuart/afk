import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DockerImageStatus } from './docker-image-status.enum';

@Entity('docker_images')
export class DockerImage {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255 })
  image: string;

  @Column('boolean', { default: false })
  isDefault: boolean;

  @Column('boolean', { default: false })
  isBuiltIn: boolean;

  @Column({
    type: 'varchar',
    enum: DockerImageStatus,
    default: DockerImageStatus.AVAILABLE,
  })
  status: DockerImageStatus;

  @Column('text', { nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(partial?: Partial<DockerImage>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  markAsNotPulled(): void {
    this.status = DockerImageStatus.NOT_PULLED;
    this.errorMessage = null;
    this.isDefault = false;
    this.updatedAt = new Date();
  }

  markAsPulling(): void {
    this.status = DockerImageStatus.PULLING;
    this.errorMessage = null;
    this.updatedAt = new Date();
  }

  markAsAvailable(): void {
    this.status = DockerImageStatus.AVAILABLE;
    this.errorMessage = null;
    this.updatedAt = new Date();
  }

  markAsError(message: string): void {
    this.status = DockerImageStatus.ERROR;
    this.errorMessage = message;
    this.updatedAt = new Date();
  }

  setAsDefault(): void {
    this.isDefault = true;
    this.updatedAt = new Date();
  }

  unsetDefault(): void {
    this.isDefault = false;
    this.updatedAt = new Date();
  }
}
