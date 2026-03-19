import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ScheduledJob } from '../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduleType } from '../../domain/scheduled-jobs/schedule-type.enum';
import { AppConfig } from '../../libs/config/app.config';

const PLIST_PREFIX = 'com.afk.job';
const LAUNCH_AGENTS_DIR = path.join(os.homedir(), 'Library', 'LaunchAgents');

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

    const plistPath = this.getPlistPath(job.id);
    const plistContent = this.buildPlistContent(job);

    try {
      fs.mkdirSync(LAUNCH_AGENTS_DIR, { recursive: true });
      fs.writeFileSync(plistPath, plistContent, 'utf-8');

      await this.launchctlLoad(plistPath);

      this.logger.log('Created and loaded LaunchAgent plist', {
        jobId: job.id,
        path: plistPath,
      });
    } catch (err) {
      this.logger.error('Failed to create LaunchAgent plist', {
        jobId: job.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async removePlist(jobId: string): Promise<void> {
    if (!this.enabled) return;

    const plistPath = this.getPlistPath(jobId);

    try {
      await this.launchctlUnload(plistPath);
    } catch {
      // May not be loaded
    }

    try {
      if (fs.existsSync(plistPath)) {
        fs.unlinkSync(plistPath);
        this.logger.log('Removed LaunchAgent plist', {
          jobId,
          path: plistPath,
        });
      }
    } catch (err) {
      this.logger.error('Failed to remove LaunchAgent plist', {
        jobId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  async updatePlist(job: ScheduledJob): Promise<void> {
    if (!this.enabled) return;

    await this.removePlist(job.id);

    if (job.enabled) {
      await this.createPlist(job);
    }
  }

  private buildPlistContent(job: ScheduledJob): string {
    const label = this.getPlistLabel(job.id);
    const triggerUrl = `http://localhost:${this.serverPort}/api/scheduled-jobs/${job.id}/trigger`;

    const shellScript = [
      `if ! curl -sf http://localhost:${this.serverPort}/api/health/live > /dev/null 2>&1; then`,
      `  open -a AFK`,
      `  for i in $(seq 1 30); do`,
      `    sleep 2`,
      `    curl -sf http://localhost:${this.serverPort}/api/health/live > /dev/null 2>&1 && break`,
      `  done`,
      `fi`,
      `curl -sf -X POST -H "X-Trigger-Token: ${job.triggerToken}" ${triggerUrl}`,
    ].join('\n      ');

    const scheduleSection = this.buildScheduleSection(job);

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

  private buildScheduleSection(job: ScheduledJob): string {
    if (job.scheduleType === ScheduleType.INTERVAL && job.intervalMs) {
      const intervalSeconds = Math.max(60, Math.round(job.intervalMs / 1000));
      return [
        `  <key>StartInterval</key>`,
        `  <integer>${intervalSeconds}</integer>`,
      ].join('\n');
    }

    if (job.scheduleType === ScheduleType.CRON && job.cronExpression) {
      return this.cronToCalendarInterval(job.cronExpression);
    }

    return '';
  }

  /**
   * Converts a simple cron expression to a launchd StartCalendarInterval.
   * Supports standard 5-field cron: minute hour dayOfMonth month dayOfWeek
   */
  private cronToCalendarInterval(cron: string): string {
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

  private async launchctlLoad(plistPath: string): Promise<void> {
    const { execSync } = require('child_process');
    try {
      execSync(`launchctl load "${plistPath}"`, { stdio: 'pipe' });
    } catch (err) {
      this.logger.warn('launchctl load failed', {
        path: plistPath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async launchctlUnload(plistPath: string): Promise<void> {
    const { execSync } = require('child_process');
    try {
      execSync(`launchctl unload "${plistPath}"`, { stdio: 'pipe' });
    } catch (err) {
      this.logger.warn('launchctl unload failed', {
        path: plistPath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private getPlistLabel(jobId: string): string {
    return `${PLIST_PREFIX}.${jobId}`;
  }

  private getPlistPath(jobId: string): string {
    return path.join(LAUNCH_AGENTS_DIR, `${this.getPlistLabel(jobId)}.plist`);
  }
}
