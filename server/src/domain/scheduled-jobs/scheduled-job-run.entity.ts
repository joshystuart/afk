import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ScheduledJob } from './scheduled-job.entity';
import { ScheduledJobRunStatus } from './scheduled-job-run-status.enum';

@Entity('scheduled_job_runs')
export class ScheduledJobRun {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 36 })
  @Index()
  jobId: string;

  @ManyToOne(() => ScheduledJob, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'jobId' })
  job: ScheduledJob;

  @Column({
    type: 'varchar',
    enum: ScheduledJobRunStatus,
    default: ScheduledJobRunStatus.PENDING,
  })
  status: ScheduledJobRunStatus;

  @Column('varchar', { length: 255, nullable: true })
  branch: string | null;

  @Column('varchar', { length: 255, nullable: true })
  containerId: string | null;

  @Column('json', { nullable: true })
  streamEvents: any[] | null;

  @Column('int', { nullable: true })
  streamEventCount: number | null;

  @Column('int', { nullable: true })
  streamByteCount: number | null;

  @Column('text', { nullable: true })
  errorMessage: string | null;

  @Column('boolean', { default: false })
  committed: boolean;

  @Column('integer', { nullable: true })
  filesChanged: number | null;

  @Column('varchar', { length: 255, nullable: true })
  commitSha: string | null;

  @Column('integer', { nullable: true })
  durationMs: number | null;

  @Column('datetime', { nullable: true })
  startedAt: Date | null;

  @Column('datetime', { nullable: true })
  completedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  markRunning(): void {
    this.status = ScheduledJobRunStatus.RUNNING;
    this.startedAt = new Date();
  }

  markCompleted(): void {
    this.status = ScheduledJobRunStatus.COMPLETED;
    this.completedAt = new Date();
    if (this.startedAt) {
      this.durationMs = this.completedAt.getTime() - this.startedAt.getTime();
    }
  }

  markFailed(errorMessage: string): void {
    this.status = ScheduledJobRunStatus.FAILED;
    this.errorMessage = errorMessage;
    this.completedAt = new Date();
    if (this.startedAt) {
      this.durationMs = this.completedAt.getTime() - this.startedAt.getTime();
    }
  }
}
