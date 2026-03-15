import { Column } from 'typeorm';

export class GeneralSettings {
  @Column('varchar', { length: 255, nullable: true })
  claudeToken?: string;

  @Column('varchar', { length: 500, nullable: true })
  defaultMountDirectory?: string | null;
}
