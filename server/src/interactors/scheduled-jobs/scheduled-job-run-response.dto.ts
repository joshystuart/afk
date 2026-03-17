import { ScheduledJobRun } from '../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunStatus } from '../../domain/scheduled-jobs/scheduled-job-run-status.enum';

export class ScheduledJobRunResponseDto {
  id!: string;
  jobId!: string;
  status!: ScheduledJobRunStatus;
  branch?: string;
  containerId?: string;
  streamEvents?: any[];
  errorMessage?: string;
  committed!: boolean;
  filesChanged?: number;
  commitSha?: string;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt!: string;

  static fromDomain(run: ScheduledJobRun): ScheduledJobRunResponseDto {
    const dto = new ScheduledJobRunResponseDto();
    dto.id = run.id;
    dto.jobId = run.jobId;
    dto.status = run.status;
    dto.branch = run.branch || undefined;
    dto.containerId = run.containerId || undefined;
    dto.streamEvents = run.streamEvents || undefined;
    dto.errorMessage = run.errorMessage || undefined;
    dto.committed = run.committed;
    dto.filesChanged = run.filesChanged ?? undefined;
    dto.commitSha = run.commitSha || undefined;
    dto.durationMs = run.durationMs ?? undefined;
    dto.startedAt = run.startedAt?.toISOString();
    dto.completedAt = run.completedAt?.toISOString();
    dto.createdAt = run.createdAt.toISOString();
    return dto;
  }
}
