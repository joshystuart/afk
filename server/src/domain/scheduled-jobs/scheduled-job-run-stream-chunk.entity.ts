import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ScheduledJobRun } from './scheduled-job-run.entity';

@Entity('scheduled_job_run_stream_chunks')
@Index(['run', 'sequence'], { unique: true })
export class ScheduledJobRunStreamChunk {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @ManyToOne(() => ScheduledJobRun, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'runId' })
  run: ScheduledJobRun;

  @Column('int')
  sequence: number;

  @Column('text')
  payload: string;

  @Column('int')
  eventCount: number;

  @Column('int')
  byteLength: number;

  @CreateDateColumn()
  createdAt: Date;

  constructor(partial?: Partial<ScheduledJobRunStreamChunk>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
