import { Injectable, Logger } from '@nestjs/common';
import {
  ClaudeStreamRunnerResult,
  ClaudeStreamRunnerService,
} from '../../../libs/claude/claude-stream-runner.service';
import {
  GitCommitAndPushResult,
  GitService,
} from '../../../libs/git/git.service';
import { ClaudeEventArchiveService } from '../../../libs/stream-archive/claude-event-archive.service';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRun } from '../../../domain/scheduled-jobs/scheduled-job-run.entity';
import { getExecWorkingDir } from '../../../libs/docker/docker.constants';
import { ScheduledJobRunEventsService } from './scheduled-job-run-events.service';

export interface ScheduledJobExecutionResult {
  streamResult: ClaudeStreamRunnerResult;
  commitResult: GitCommitAndPushResult | null;
}

@Injectable()
export class ScheduledJobClaudeGitService {
  private readonly logger = new Logger(ScheduledJobClaudeGitService.name);

  constructor(
    private readonly claudeStreamRunner: ClaudeStreamRunnerService,
    private readonly claudeEventArchive: ClaudeEventArchiveService,
    private readonly gitService: GitService,
    private readonly scheduledJobRunEvents: ScheduledJobRunEventsService,
  ) {}

  async execute(
    job: ScheduledJob,
    run: ScheduledJobRun,
    containerId: string,
    branchName: string,
  ): Promise<ScheduledJobExecutionResult> {
    const workspaceDir = getExecWorkingDir(job.repoUrl);

    if (job.createNewBranch) {
      this.logger.log('Creating new branch', {
        jobId: job.id,
        runId: run.id,
        branchName,
      });
      await this.gitService.createBranch(containerId, branchName, workspaceDir);
    }

    this.logger.log('Executing Claude prompt', {
      jobId: job.id,
      runId: run.id,
      promptLength: job.prompt.length,
    });
    const streamResult = await this.runClaudePrompt(
      containerId,
      run.id,
      job.id,
      job.prompt,
      job.model,
      workspaceDir,
    );

    const commitResult = job.commitAndPush
      ? await this.gitService.commitAndPush(containerId, {
          message: 'AFK scheduled job: automated changes',
          branchName,
          workingDir: workspaceDir,
        })
      : null;

    return {
      streamResult,
      commitResult,
    };
  }

  private async runClaudePrompt(
    containerId: string,
    runId: string,
    jobId: string,
    prompt: string,
    model: string | null | undefined,
    workingDir: string,
  ): Promise<ClaudeStreamRunnerResult> {
    const archiveWriter = this.claudeEventArchive.createJobRunWriter(runId);
    const execution = await this.claudeStreamRunner.startPrompt({
      containerId,
      prompt,
      model: model ?? undefined,
      workingDir,
      includePartialMessages: true,
      archiveWriter,
      onEvent: (event) => {
        this.scheduledJobRunEvents.publishStream(
          jobId,
          runId,
          event as unknown,
        );
      },
    });

    return execution.result;
  }
}
