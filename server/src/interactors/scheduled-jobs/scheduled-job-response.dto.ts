import { ScheduledJob } from '../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduleType } from '../../domain/scheduled-jobs/schedule-type.enum';

export class ScheduledJobResponseDto {
  id!: string;
  name!: string;
  repoUrl!: string;
  branch!: string;
  createNewBranch!: boolean;
  newBranchPrefix?: string;
  imageId!: string;
  prompt!: string;
  model?: string;
  scheduleType!: ScheduleType;
  cronExpression?: string;
  intervalMs?: number;
  commitAndPush!: boolean;
  enabled!: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt!: string;
  updatedAt!: string;

  static fromDomain(job: ScheduledJob): ScheduledJobResponseDto {
    const dto = new ScheduledJobResponseDto();
    dto.id = job.id;
    dto.name = job.name;
    dto.repoUrl = job.repoUrl;
    dto.branch = job.branch;
    dto.createNewBranch = job.createNewBranch;
    dto.newBranchPrefix = job.newBranchPrefix || undefined;
    dto.imageId = job.imageId;
    dto.prompt = job.prompt;
    dto.model = job.model || undefined;
    dto.scheduleType = job.scheduleType;
    dto.cronExpression = job.cronExpression || undefined;
    dto.intervalMs = job.intervalMs || undefined;
    dto.commitAndPush = job.commitAndPush;
    dto.enabled = job.enabled;
    dto.lastRunAt = job.lastRunAt?.toISOString();
    dto.nextRunAt = job.nextRunAt?.toISOString();
    dto.createdAt = job.createdAt.toISOString();
    dto.updatedAt = job.updatedAt.toISOString();
    return dto;
  }
}
