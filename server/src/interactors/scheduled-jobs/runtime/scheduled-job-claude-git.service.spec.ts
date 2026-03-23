import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRun } from '../../../domain/scheduled-jobs/scheduled-job-run.entity';
import { ClaudeStreamRunnerService } from '../../../libs/claude/claude-stream-runner.service';
import { GitService } from '../../../libs/git/git.service';
import { ClaudeEventArchiveService } from '../../../libs/stream-archive/claude-event-archive.service';
import { ScheduledJobRunEventsService } from './scheduled-job-run-events.service';
import { ScheduledJobClaudeGitService } from './scheduled-job-claude-git.service';

describe('ScheduledJobClaudeGitService', () => {
  let service: ScheduledJobClaudeGitService;
  let claudeStreamRunner: jest.Mocked<ClaudeStreamRunnerService>;
  let claudeEventArchive: jest.Mocked<ClaudeEventArchiveService>;
  let gitService: jest.Mocked<GitService>;
  let scheduledJobRunEvents: jest.Mocked<ScheduledJobRunEventsService>;

  beforeEach(() => {
    claudeStreamRunner = {
      startPrompt: jest.fn(),
    } as unknown as jest.Mocked<ClaudeStreamRunnerService>;

    claudeEventArchive = {
      createJobRunWriter: jest.fn(),
    } as unknown as jest.Mocked<ClaudeEventArchiveService>;

    gitService = {
      createBranch: jest.fn(),
      commitAndPush: jest.fn(),
    } as unknown as jest.Mocked<GitService>;

    scheduledJobRunEvents = {
      publishStream: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRunEventsService>;

    service = new ScheduledJobClaudeGitService(
      claudeStreamRunner,
      claudeEventArchive,
      gitService,
      scheduledJobRunEvents,
    );
  });

  it('runs Claude and commit/push for a branch-creating job', async () => {
    const archiveWriter = {
      appendEvent: jest.fn(),
      finalize: jest.fn(),
    };
    const streamResult = {
      streamEventCount: 5,
      streamByteCount: 250,
      conversationId: 'conversation-1',
      costUsd: 0.42,
      resultContent: 'done',
      durationMs: 1_000,
    };
    const job = Object.assign(new ScheduledJob(), {
      id: 'job-1',
      prompt: 'fix things',
      model: 'sonnet',
      createNewBranch: true,
      commitAndPush: true,
    });
    const run = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
    });

    claudeEventArchive.createJobRunWriter.mockReturnValue(archiveWriter as any);
    claudeStreamRunner.startPrompt.mockImplementation(async (options) => {
      await options.onEvent?.({ type: 'stdout', chunk: 'hello' });
      return {
        result: Promise.resolve(streamResult),
        kill: jest.fn(),
      };
    });
    gitService.commitAndPush.mockResolvedValue({
      committed: true,
      pushed: true,
      filesChanged: 2,
      commitSha: 'abc123',
      commitError: null,
      pushError: null,
    });

    const result = await service.execute(
      job,
      run,
      'container-1',
      'feature/auto-fix',
    );

    expect(gitService.createBranch).toHaveBeenCalledWith(
      'container-1',
      'feature/auto-fix',
      '/workspace/repo',
    );
    expect(claudeStreamRunner.startPrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        containerId: 'container-1',
        prompt: 'fix things',
        model: 'sonnet',
        workingDir: '/workspace/repo',
        includePartialMessages: true,
        archiveWriter,
      }),
    );
    expect(scheduledJobRunEvents.publishStream).toHaveBeenCalledWith(
      'job-1',
      'run-1',
      { type: 'stdout', chunk: 'hello' },
    );
    expect(gitService.commitAndPush).toHaveBeenCalledWith('container-1', {
      message: 'AFK scheduled job: automated changes',
      branchName: 'feature/auto-fix',
      workingDir: '/workspace/repo',
    });
    expect(result).toEqual({
      streamResult,
      commitResult: {
        committed: true,
        pushed: true,
        filesChanged: 2,
        commitSha: 'abc123',
        commitError: null,
        pushError: null,
      },
    });
  });

  it('skips branch creation and commit/push when the job does not request them', async () => {
    const streamResult = {
      streamEventCount: 1,
      streamByteCount: 10,
      conversationId: null,
      costUsd: null,
      resultContent: 'done',
      durationMs: 100,
    };
    const job = Object.assign(new ScheduledJob(), {
      id: 'job-1',
      prompt: 'noop',
      model: null,
      createNewBranch: false,
      commitAndPush: false,
    });
    const run = Object.assign(new ScheduledJobRun(), {
      id: 'run-1',
    });

    claudeEventArchive.createJobRunWriter.mockReturnValue({
      appendEvent: jest.fn(),
      finalize: jest.fn(),
    } as any);
    claudeStreamRunner.startPrompt.mockResolvedValue({
      result: Promise.resolve(streamResult),
      kill: jest.fn(),
    });

    const result = await service.execute(job, run, 'container-1', 'main');

    expect(gitService.createBranch).not.toHaveBeenCalled();
    expect(gitService.commitAndPush).not.toHaveBeenCalled();
    expect(result).toEqual({
      streamResult,
      commitResult: null,
    });
  });
});
