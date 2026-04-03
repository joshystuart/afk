import { Injectable, Logger } from '@nestjs/common';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduleType } from '../../../domain/scheduled-jobs/schedule-type.enum';
import { AppConfig } from '../../../libs/config/app.config';

export const PLIST_PREFIX = 'com.afk.job';
export const DEFAULT_LAUNCH_AGENTS_DIR = path.join(
  os.homedir(),
  'Library',
  'LaunchAgents',
);

interface LaunchdLogger {
  log(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface ManagedLaunchAgentPlist {
  jobId: string;
  label: string;
  path: string;
}

export interface ReconcileLaunchAgentsResult {
  removedOrphaned: number;
  removedDisabled: number;
  recreatedEnabled: number;
}

interface LaunchAgentMutationOptions {
  launchAgentsDir?: string;
  logger?: LaunchdLogger;
  runLaunchctl?: boolean;
}

function getPlistLabel(jobId: string): string {
  return `${PLIST_PREFIX}.${jobId}`;
}

function getPlistPath(
  jobId: string,
  launchAgentsDir: string = DEFAULT_LAUNCH_AGENTS_DIR,
): string {
  return path.join(launchAgentsDir, `${getPlistLabel(jobId)}.plist`);
}

function escapeShellString(value: string): string {
  return value.replace(/'/g, `'\\''`);
}

function runLaunchctl(
  action: 'load' | 'unload',
  plistPath: string,
  options: LaunchAgentMutationOptions = {},
): void {
  if (options.runLaunchctl === false) {
    return;
  }

  try {
    execSync(`launchctl ${action} "${plistPath}"`, { stdio: 'pipe' });
  } catch (error) {
    options.logger?.warn(`launchctl ${action} failed`, {
      path: plistPath,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function listManagedLaunchAgentPlists(
  launchAgentsDir: string = DEFAULT_LAUNCH_AGENTS_DIR,
): ManagedLaunchAgentPlist[] {
  if (!fs.existsSync(launchAgentsDir)) {
    return [];
  }

  return fs
    .readdirSync(launchAgentsDir)
    .filter(
      (entry) =>
        entry.startsWith(`${PLIST_PREFIX}.`) &&
        entry.endsWith('.plist') &&
        entry.length > `${PLIST_PREFIX}..plist`.length,
    )
    .map((entry) => {
      const label = entry.replace(/\.plist$/, '');
      return {
        jobId: label.slice(`${PLIST_PREFIX}.`.length),
        label,
        path: path.join(launchAgentsDir, entry),
      };
    });
}

export function buildLaunchdPlistContent(
  job: ScheduledJob,
  serverPort: number,
): string {
  const label = getPlistLabel(job.id);
  const liveUrl = `http://localhost:${serverPort}/api/health/live`;
  const triggerUrl = `http://localhost:${serverPort}/api/scheduled-jobs/${job.id}/trigger`;
  const logMessage = `AFK server unavailable; skipping scheduled job ${job.id}`;
  const triggerFailureMessage = `Failed to trigger scheduled job ${job.id}`;

  const shellScript = [
    `if ! curl -sf ${liveUrl} > /dev/null 2>&1; then`,
    `  echo '${escapeShellString(logMessage)}' >&2`,
    `  exit 0`,
    `fi`,
    `if ! curl -sf -X POST -H "X-Trigger-Token: ${job.triggerToken}" ${triggerUrl}; then`,
    `  echo '${escapeShellString(triggerFailureMessage)}' >&2`,
    `fi`,
  ].join('\n      ');

  const scheduleSection = buildScheduleSection(job);

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">`,
    `<plist version="1.0">`,
    `<dict>`,
    `  <key>Label</key>`,
    `  <string>${label}</string>`,
    `  <key>ProgramArguments</key>`,
    `  <array>`,
    `    <string>/bin/bash</string>`,
    `    <string>-c</string>`,
    `    <string>`,
    `      ${shellScript}`,
    `    </string>`,
    `  </array>`,
    scheduleSection,
    `  <key>RunAtLoad</key>`,
    `  <false/>`,
    `  <key>StandardOutPath</key>`,
    `  <string>/tmp/${label}.out.log</string>`,
    `  <key>StandardErrorPath</key>`,
    `  <string>/tmp/${label}.err.log</string>`,
    `</dict>`,
    `</plist>`,
  ].join('\n');
}

export function removeManagedLaunchAgentPlists(
  jobIds?: Iterable<string>,
  options: LaunchAgentMutationOptions = {},
): number {
  const selectedJobIds = jobIds ? new Set(jobIds) : null;
  const plists = listManagedLaunchAgentPlists(options.launchAgentsDir).filter(
    (plist) => !selectedJobIds || selectedJobIds.has(plist.jobId),
  );

  for (const plist of plists) {
    runLaunchctl('unload', plist.path, options);

    try {
      fs.unlinkSync(plist.path);
      options.logger?.log('Removed LaunchAgent plist', {
        jobId: plist.jobId,
        path: plist.path,
      });
    } catch (error) {
      options.logger?.error('Failed to remove LaunchAgent plist', {
        jobId: plist.jobId,
        path: plist.path,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return plists.length;
}

export function reconcileManagedLaunchAgentPlists(
  jobs: ScheduledJob[],
  serverPort: number,
  options: LaunchAgentMutationOptions = {},
): ReconcileLaunchAgentsResult {
  const launchAgentsDir = options.launchAgentsDir ?? DEFAULT_LAUNCH_AGENTS_DIR;
  const jobsById = new Map(jobs.map((job) => [job.id, job]));
  const managedPlists = listManagedLaunchAgentPlists(launchAgentsDir);
  let removedOrphaned = 0;
  let removedDisabled = 0;
  let recreatedEnabled = 0;

  for (const plist of managedPlists) {
    const job = jobsById.get(plist.jobId);
    if (!job) {
      removedOrphaned += removeManagedLaunchAgentPlists([plist.jobId], options);
      continue;
    }

    if (!job.enabled) {
      removedDisabled += removeManagedLaunchAgentPlists([plist.jobId], options);
    }
  }

  for (const job of jobs) {
    if (!job.enabled) {
      continue;
    }

    const plistPath = getPlistPath(job.id, launchAgentsDir);
    const expectedContent = buildLaunchdPlistContent(job, serverPort);
    const hasExistingPlist = fs.existsSync(plistPath);
    const currentContent = hasExistingPlist
      ? fs.readFileSync(plistPath, 'utf-8')
      : null;

    if (currentContent === expectedContent) {
      continue;
    }

    if (hasExistingPlist) {
      removeManagedLaunchAgentPlists([job.id], options);
    }

    fs.mkdirSync(launchAgentsDir, { recursive: true });
    fs.writeFileSync(plistPath, expectedContent, 'utf-8');
    runLaunchctl('load', plistPath, options);
    recreatedEnabled++;

    options.logger?.log('Recreated missing LaunchAgent plist', {
      jobId: job.id,
      path: plistPath,
    });
  }

  return {
    removedOrphaned,
    removedDisabled,
    recreatedEnabled,
  };
}

function buildScheduleSection(job: ScheduledJob): string {
  if (job.scheduleType === ScheduleType.INTERVAL && job.intervalMs) {
    const intervalSeconds = Math.max(60, Math.round(job.intervalMs / 1000));
    return [
      `  <key>StartInterval</key>`,
      `  <integer>${intervalSeconds}</integer>`,
    ].join('\n');
  }

  if (job.scheduleType === ScheduleType.CRON && job.cronExpression) {
    return cronToCalendarInterval(job.cronExpression);
  }

  return '';
}

function cronToCalendarInterval(cron: string): string {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return '';

  const [minute, hour, day, month, weekday] = parts;
  const entries: string[] = [];

  if (minute !== '*') {
    entries.push(
      `    <key>Minute</key>\n    <integer>${parseInt(minute, 10)}</integer>`,
    );
  }
  if (hour !== '*') {
    entries.push(
      `    <key>Hour</key>\n    <integer>${parseInt(hour, 10)}</integer>`,
    );
  }
  if (day !== '*') {
    entries.push(
      `    <key>Day</key>\n    <integer>${parseInt(day, 10)}</integer>`,
    );
  }
  if (month !== '*') {
    entries.push(
      `    <key>Month</key>\n    <integer>${parseInt(month, 10)}</integer>`,
    );
  }
  if (weekday !== '*') {
    entries.push(
      `    <key>Weekday</key>\n    <integer>${parseInt(weekday, 10)}</integer>`,
    );
  }

  if (entries.length === 0) return '';

  return [
    `  <key>StartCalendarInterval</key>`,
    `  <dict>`,
    ...entries,
    `  </dict>`,
  ].join('\n');
}

@Injectable()
export class LaunchdService {
  private readonly logger = new Logger(LaunchdService.name);
  private readonly enabled: boolean;
  private readonly serverPort: number;

  constructor(private readonly appConfig: AppConfig) {
    this.enabled = process.platform === 'darwin';
    this.serverPort = appConfig.port;

    if (!this.enabled) {
      this.logger.log(
        'LaunchdService disabled (not macOS or not Electron mode)',
      );
    }
  }

  async createPlist(job: ScheduledJob): Promise<void> {
    if (!this.enabled) return;

    try {
      fs.mkdirSync(DEFAULT_LAUNCH_AGENTS_DIR, { recursive: true });

      const plistPath = getPlistPath(job.id);
      fs.writeFileSync(
        plistPath,
        buildLaunchdPlistContent(job, this.serverPort),
        'utf-8',
      );
      runLaunchctl('load', plistPath, { logger: this.logger });

      this.logger.log('Created and loaded LaunchAgent plist', {
        jobId: job.id,
        path: plistPath,
      });
    } catch (error) {
      this.logger.error('Failed to create LaunchAgent plist', {
        jobId: job.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async removePlist(jobId: string): Promise<void> {
    if (!this.enabled) return;
    removeManagedLaunchAgentPlists([jobId], { logger: this.logger });
  }

  async removeAllManagedPlists(): Promise<number> {
    if (!this.enabled) return 0;
    return removeManagedLaunchAgentPlists(undefined, { logger: this.logger });
  }

  listManagedPlists(): ManagedLaunchAgentPlist[] {
    if (!this.enabled) return [];
    return listManagedLaunchAgentPlists();
  }

  async reconcilePlists(
    jobs: ScheduledJob[],
  ): Promise<ReconcileLaunchAgentsResult> {
    if (!this.enabled) {
      return {
        removedOrphaned: 0,
        removedDisabled: 0,
        recreatedEnabled: 0,
      };
    }

    return reconcileManagedLaunchAgentPlists(jobs, this.serverPort, {
      logger: this.logger,
    });
  }

  async updatePlist(job: ScheduledJob): Promise<void> {
    if (!this.enabled) return;

    await this.removePlist(job.id);

    if (job.enabled) {
      await this.createPlist(job);
    }
  }
}
