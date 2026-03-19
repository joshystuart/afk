import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ScheduleType } from '../../domain/scheduled-jobs/schedule-type.enum';
import { ScheduledJob } from '../../domain/scheduled-jobs/scheduled-job.entity';

interface ScheduledJobDefinition {
  name: string;
  repoUrl: string;
  branch: string;
  createNewBranch?: boolean;
  newBranchPrefix?: string | null;
  imageId: string;
  prompt: string;
  model?: string | null;
  scheduleType: ScheduleType;
  cronExpression?: string | null;
  intervalMs?: number | null;
  commitAndPush?: boolean;
  enabled?: boolean;
}

type ScheduledJobUpdate = Partial<ScheduledJobDefinition>;

@Injectable()
export class ScheduledJobDefinitionService {
  create(id: string, definition: ScheduledJobDefinition): ScheduledJob {
    const job = new ScheduledJob();
    job.id = id;
    this.apply(job, definition);
    job.enabled = definition.enabled ?? true;
    job.triggerToken = randomBytes(32).toString('hex');
    job.lastRunAt = null;
    job.nextRunAt = null;
    return job;
  }

  apply(job: ScheduledJob, definition: ScheduledJobUpdate): void {
    if (definition.name !== undefined) {
      const trimmedName = definition.name.trim();
      if (!trimmedName) {
        throw new Error('Job name cannot be empty');
      }
      job.name = trimmedName;
    }

    if (definition.repoUrl !== undefined) {
      job.repoUrl = definition.repoUrl;
    }

    if (definition.branch !== undefined) {
      job.branch = definition.branch;
    }

    if (definition.createNewBranch !== undefined) {
      job.createNewBranch = definition.createNewBranch;
    }

    if (definition.newBranchPrefix !== undefined) {
      job.newBranchPrefix = this.normalizeOptionalString(
        definition.newBranchPrefix,
      );
    }

    if (definition.imageId !== undefined) {
      job.imageId = definition.imageId;
    }

    if (definition.prompt !== undefined) {
      job.prompt = definition.prompt;
    }

    if (definition.model !== undefined) {
      job.model = this.normalizeOptionalString(definition.model);
    }

    if (definition.scheduleType !== undefined) {
      job.scheduleType = definition.scheduleType;
      if (definition.scheduleType === ScheduleType.CRON) {
        job.intervalMs = null;
      }
      if (definition.scheduleType === ScheduleType.INTERVAL) {
        job.cronExpression = null;
      }
    }

    if (definition.cronExpression !== undefined) {
      job.cronExpression = this.normalizeOptionalString(
        definition.cronExpression,
      );
    }

    if (definition.intervalMs !== undefined) {
      job.intervalMs = definition.intervalMs ?? null;
    }

    if (definition.commitAndPush !== undefined) {
      job.commitAndPush = definition.commitAndPush;
    }

    if (definition.enabled !== undefined) {
      job.enabled = definition.enabled;
    }
  }

  private normalizeOptionalString(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
