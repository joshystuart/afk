import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduleType } from '../../../domain/scheduled-jobs/schedule-type.enum';
import {
  buildLaunchdPlistContent,
  listManagedLaunchAgentPlists,
  reconcileManagedLaunchAgentPlists,
  removeManagedLaunchAgentPlists,
} from './launchd.service';

describe('launchd helpers', () => {
  const logger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'afk-launchd-'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('builds plists without reopening the AFK desktop app', () => {
    const job = createJob({
      id: 'job-1',
      triggerToken: 'token-123',
      scheduleType: ScheduleType.INTERVAL,
      intervalMs: 120_000,
    });

    const plist = buildLaunchdPlistContent(job, 4310);

    expect(plist).not.toContain('open -a AFK');
    expect(plist).toContain(
      'AFK server unavailable; skipping scheduled job job-1',
    );
    expect(plist).toContain(
      'curl -sf -X POST -H "X-Trigger-Token: token-123" http://localhost:4310/api/scheduled-jobs/job-1/trigger',
    );
  });

  it('lists and removes only AFK-managed launch agents', () => {
    fs.writeFileSync(path.join(tempDir, 'com.afk.job.job-1.plist'), 'job-1');
    fs.writeFileSync(path.join(tempDir, 'com.afk.job.job-2.plist'), 'job-2');
    fs.writeFileSync(path.join(tempDir, 'com.afk.other.job-3.plist'), 'other');
    fs.writeFileSync(path.join(tempDir, 'readme.txt'), 'ignore');

    const listed = listManagedLaunchAgentPlists(tempDir);
    expect(listed.map((plist) => plist.jobId).sort()).toEqual([
      'job-1',
      'job-2',
    ]);

    const removed = removeManagedLaunchAgentPlists(['job-1'], {
      launchAgentsDir: tempDir,
      logger,
      runLaunchctl: false,
    });

    expect(removed).toBe(1);
    expect(fs.existsSync(path.join(tempDir, 'com.afk.job.job-1.plist'))).toBe(
      false,
    );
    expect(fs.existsSync(path.join(tempDir, 'com.afk.job.job-2.plist'))).toBe(
      true,
    );
    expect(fs.existsSync(path.join(tempDir, 'com.afk.other.job-3.plist'))).toBe(
      true,
    );
  });

  it('reconciles launch agents by removing stale entries and rewriting enabled jobs', () => {
    fs.writeFileSync(
      path.join(tempDir, 'com.afk.job.job-enabled.plist'),
      'open -a AFK',
    );
    fs.writeFileSync(
      path.join(tempDir, 'com.afk.job.job-disabled.plist'),
      'disabled',
    );
    fs.writeFileSync(
      path.join(tempDir, 'com.afk.job.job-stale.plist'),
      'stale',
    );

    const jobs = [
      createJob({
        id: 'job-enabled',
        enabled: true,
        triggerToken: 'enabled-token',
      }),
      createJob({
        id: 'job-disabled',
        enabled: false,
        triggerToken: 'disabled-token',
      }),
    ];

    const result = reconcileManagedLaunchAgentPlists(jobs, 4310, {
      launchAgentsDir: tempDir,
      logger,
      runLaunchctl: false,
    });

    expect(result).toEqual({
      removedOrphaned: 1,
      removedDisabled: 1,
      recreatedEnabled: 1,
    });
    const enabledPlistPath = path.join(
      tempDir,
      'com.afk.job.job-enabled.plist',
    );
    expect(fs.existsSync(enabledPlistPath)).toBe(true);
    expect(fs.readFileSync(enabledPlistPath, 'utf-8')).not.toContain(
      'open -a AFK',
    );
    expect(
      fs.existsSync(path.join(tempDir, 'com.afk.job.job-disabled.plist')),
    ).toBe(false);
    expect(
      fs.existsSync(path.join(tempDir, 'com.afk.job.job-stale.plist')),
    ).toBe(false);
  });
});

function createJob(overrides: Partial<ScheduledJob> = {}): ScheduledJob {
  return Object.assign(new ScheduledJob(), {
    id: 'job-default',
    name: 'Test Job',
    repoUrl: 'https://github.com/acme/repo',
    branch: 'main',
    createNewBranch: false,
    newBranchPrefix: null,
    imageId: 'image-1',
    prompt: 'Test prompt',
    model: null,
    scheduleType: ScheduleType.CRON,
    cronExpression: '0 * * * *',
    intervalMs: null,
    commitAndPush: false,
    enabled: true,
    triggerToken: 'token',
    lastRunAt: null,
    nextRunAt: null,
    createdAt: new Date('2026-03-28T00:00:00.000Z'),
    updatedAt: new Date('2026-03-28T00:00:00.000Z'),
    ...overrides,
  });
}
