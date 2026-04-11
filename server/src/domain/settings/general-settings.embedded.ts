import { Column } from 'typeorm';

export class GeneralSettings {
  @Column('varchar', { length: 255, nullable: true })
  claudeToken?: string;

  @Column('varchar', { length: 500, nullable: true })
  defaultMountDirectory?: string | null;

  @Column('varchar', { length: 500, nullable: true })
  skillsDirectory?: string | null;

  @Column('boolean', { default: true })
  idleCleanupEnabled: boolean = true;

  @Column('integer', { default: 120 })
  idleTimeoutMinutes: number = 120;
}
