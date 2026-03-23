import { Injectable } from '@nestjs/common';
import { ScheduledJob } from '../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRun } from '../domain/scheduled-jobs/scheduled-job-run.entity';
import { ScheduledJobRunRepository } from '../domain/scheduled-jobs/scheduled-job-run.repository';
import { ScheduleType } from '../domain/scheduled-jobs/schedule-type.enum';
import { ScheduledJobRunStatus } from '../domain/scheduled-jobs/scheduled-job-run-status.enum';

export interface ScheduledJobRunGatewayResponse {
  id: string;
  jobId: string;
  status: ScheduledJobRunStatus;
  branch?: string;
  containerId?: string;
  streamEventCount?: number;
  streamByteCount?: number;
  errorMessage?: string;
  committed: boolean;
  filesChanged?: number;
  commitSha?: string;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ScheduledJobRunSummaryGatewayResponse {
  id: string;
  jobId: string;
  status: ScheduledJobRunStatus;
  branch?: string;
  startedAt?: string;
  createdAt: string;
}

export interface ScheduledJobGatewayResponse {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  createNewBranch: boolean;
  newBranchPrefix?: string;
  imageId: string;
  prompt: string;
  model?: string;
  scheduleType: ScheduleType;
  cronExpression?: string;
  intervalMs?: number;
  commitAndPush: boolean;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  currentRun?: ScheduledJobRunSummaryGatewayResponse;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ScheduledJobGatewayResponseFactory {
  constructor(
    private readonly scheduledJobRunRepository: ScheduledJobRunRepository,
  ) {}

  async createJob(job: ScheduledJob): Promise<ScheduledJobGatewayResponse> {
    const currentRun = await this.scheduledJobRunRepository.findActiveByJobId(
      job.id,
    );

    return {
      id: job.id,
      name: job.name,
      repoUrl: job.repoUrl,
      branch: job.branch,
      createNewBranch: job.createNewBranch,
      newBranchPrefix: job.newBranchPrefix || undefined,
      imageId: job.imageId,
      prompt: job.prompt,
      model: job.model || undefined,
      scheduleType: job.scheduleType,
      cronExpression: job.cronExpression || undefined,
      intervalMs: job.intervalMs || undefined,
      commitAndPush: job.commitAndPush,
      enabled: job.enabled,
      lastRunAt: job.lastRunAt?.toISOString(),
      nextRunAt: job.nextRunAt?.toISOString(),
      currentRun: currentRun ? this.createRunSummary(currentRun) : undefined,
      createdAt: job.createdAt.toISOString(),
      updatedAt: job.updatedAt.toISOString(),
    };
  }

  createRun(run: ScheduledJobRun): ScheduledJobRunGatewayResponse {
    return {
      id: run.id,
      jobId: run.jobId,
      status: run.status,
      branch: run.branch || undefined,
      containerId: run.containerId || undefined,
      streamEventCount: run.streamEventCount ?? undefined,
      streamByteCount: run.streamByteCount ?? undefined,
      errorMessage: run.errorMessage || undefined,
      committed: run.committed,
      filesChanged: run.filesChanged ?? undefined,
      commitSha: run.commitSha || undefined,
      durationMs: run.durationMs ?? undefined,
      startedAt: run.startedAt?.toISOString(),
      completedAt: run.completedAt?.toISOString(),
      createdAt: run.createdAt.toISOString(),
    };
  }

  private createRunSummary(
    run: ScheduledJobRun,
  ): ScheduledJobRunSummaryGatewayResponse {
    return {
      id: run.id,
      jobId: run.jobId,
      status: run.status,
      branch: run.branch || undefined,
      startedAt: run.startedAt?.toISOString(),
      createdAt: run.createdAt.toISOString(),
    };
  }
}
