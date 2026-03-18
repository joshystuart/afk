import { ScheduledJobRun } from '../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunStatus } from '../../domain/scheduled-jobs/scheduled-job-run-status.enum';

export class ScheduledJobRunSummaryDto {
  id!: string;
  jobId!: string;
  status!: ScheduledJobRunStatus;
  branch?: string;
  startedAt?: string;
  createdAt!: string;

  static fromDomain(run: ScheduledJobRun): ScheduledJobRunSummaryDto {
    const dto = new ScheduledJobRunSummaryDto();
    dto.id = run.id;
    dto.jobId = run.jobId;
    dto.status = run.status;
    dto.branch = run.branch || undefined;
    dto.startedAt = run.startedAt?.toISOString();
    dto.createdAt = run.createdAt.toISOString();
    return dto;
  }
}
