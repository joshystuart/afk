import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ScheduleType } from './schedule-type.enum';

@Entity('scheduled_jobs')
export class ScheduledJob {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 500 })
  repoUrl: string;

  @Column('varchar', { length: 255 })
  branch: string;

  @Column('boolean', { default: false })
  createNewBranch: boolean;

  @Column('varchar', { length: 255, nullable: true })
  newBranchPrefix: string | null;

  @Column('varchar', { length: 36 })
  imageId: string;

  @Column('text')
  prompt: string;

  @Column({ type: 'varchar', enum: ScheduleType })
  scheduleType: ScheduleType;

  @Column('varchar', { length: 255, nullable: true })
  cronExpression: string | null;

  @Column('integer', { nullable: true })
  intervalMs: number | null;

  @Column('boolean', { default: false })
  commitAndPush: boolean;

  @Column('boolean', { default: true })
  enabled: boolean;

  @Column('datetime', { nullable: true })
  lastRunAt: Date | null;

  @Column('datetime', { nullable: true })
  nextRunAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  disable(): void {
    this.enabled = false;
    this.updatedAt = new Date();
  }

  enable(): void {
    this.enabled = true;
    this.updatedAt = new Date();
  }

  recordRun(runAt: Date): void {
    this.lastRunAt = runAt;
    this.updatedAt = new Date();
  }
}
