import { Injectable, Logger } from '@nestjs/common';
import { DockerEngineService } from '../docker/docker-engine.service';

const DEFAULT_WORKSPACE_DIR = '/workspace/repo';

export interface GitStatusResult {
  hasChanges: boolean;
  changedFileCount: number;
  branch: string;
}

export interface GitCommitAndPushOptions {
  message: string;
  branchName?: string;
  remoteName?: string;
  workingDir?: string;
}

export interface GitCommitAndPushResult {
  committed: boolean;
  pushed: boolean;
  filesChanged: number;
  commitSha: string | null;
  commitError: string | null;
  pushError: string | null;
}

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);

  constructor(private readonly dockerEngine: DockerEngineService) {}

  async getStatus(
    containerId: string,
    workingDir = DEFAULT_WORKSPACE_DIR,
  ): Promise<GitStatusResult> {
    const [statusResult, branchResult] = await Promise.all([
      this.dockerEngine.execInContainer(
        containerId,
        ['git', 'status', '--porcelain'],
        workingDir,
      ),
      this.dockerEngine.execInContainer(
        containerId,
        ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
        workingDir,
      ),
    ]);

    const changedFiles = this.parseChangedFiles(statusResult.stdout);

    return {
      hasChanges: changedFiles.length > 0,
      changedFileCount: changedFiles.length,
      branch: branchResult.stdout.trim() || 'unknown',
    };
  }

  async createBranch(
    containerId: string,
    branchName: string,
    workingDir = DEFAULT_WORKSPACE_DIR,
  ): Promise<void> {
    const result = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'checkout', '-b', branchName],
      workingDir,
    );

    if (result.exitCode !== 0) {
      throw new Error(
        result.stderr || result.stdout || 'Failed to create branch',
      );
    }
  }

  async commitAndPush(
    containerId: string,
    options: GitCommitAndPushOptions,
  ): Promise<GitCommitAndPushResult> {
    const workingDir = options.workingDir ?? DEFAULT_WORKSPACE_DIR;

    const addResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'add', '-A'],
      workingDir,
    );

    if (addResult.exitCode !== 0) {
      throw new Error(addResult.stderr || addResult.stdout || 'git add failed');
    }

    const statusResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'status', '--porcelain'],
      workingDir,
    );
    const filesChanged = this.parseChangedFiles(statusResult.stdout).length;

    if (filesChanged === 0) {
      this.logger.log('No changes to commit');
      return {
        committed: false,
        pushed: false,
        filesChanged: 0,
        commitSha: null,
        commitError: null,
        pushError: null,
      };
    }

    const commitResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'commit', '-m', options.message.trim()],
      workingDir,
    );

    if (commitResult.exitCode !== 0) {
      const commitError =
        commitResult.stderr.trim() ||
        commitResult.stdout.trim() ||
        'git commit failed';
      this.logger.warn('Git commit failed', { stderr: commitResult.stderr });
      return {
        committed: false,
        pushed: false,
        filesChanged,
        commitSha: null,
        commitError,
        pushError: null,
      };
    }

    const shaResult = await this.dockerEngine.execInContainer(
      containerId,
      ['git', 'rev-parse', 'HEAD'],
      workingDir,
    );
    const commitSha = shaResult.stdout.trim() || null;

    const pushCommand = ['git', 'push'];
    if (options.branchName) {
      pushCommand.push(options.remoteName ?? 'origin', options.branchName);
    }

    const pushResult = await this.dockerEngine.execInContainer(
      containerId,
      pushCommand,
      workingDir,
    );

    if (pushResult.exitCode !== 0) {
      const pushError =
        pushResult.stderr.trim() ||
        pushResult.stdout.trim() ||
        'git push failed';
      this.logger.warn('Git push failed', { stderr: pushResult.stderr });
      return {
        committed: true,
        pushed: false,
        filesChanged,
        commitSha,
        commitError: null,
        pushError,
      };
    }

    return {
      committed: true,
      pushed: true,
      filesChanged,
      commitSha,
      commitError: null,
      pushError: null,
    };
  }

  private parseChangedFiles(stdout: string): string[] {
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }
}
