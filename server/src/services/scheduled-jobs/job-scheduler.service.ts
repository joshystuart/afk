import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { ScheduledJobRepository } from '../../domain/scheduled-jobs/scheduled-job.repository';
import { ScheduledJob } from '../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduleType } from '../../domain/scheduled-jobs/schedule-type.enum';
import { JobExecutorService } from './job-executor.service';
import { ScheduledJobTimingService } from './scheduled-job-timing.service';

const JOB_PREFIX = 'scheduled-job:';

@Injectable()
export class JobSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(JobSchedulerService.name);
  private readonly intervalHandles = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly scheduledJobRepository: ScheduledJobRepository,
    private readonly jobExecutor: JobExecutorService,
    private readonly scheduledJobTimingService: ScheduledJobTimingService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadAndRegisterAll();
  }

  onModuleDestroy(): void {
    this.unregisterAll();
  }

  async registerJob(job: ScheduledJob): Promise<void> {
    this.unregisterJob(job.id);

    if (!job.enabled) {
      await this.persistNextRunAt(job, null);
      this.logger.log('Job is disabled, not registering', { jobId: job.id });
      return;
    }

    const schedulerKey = this.getSchedulerKey(job.id);

    if (job.scheduleType === ScheduleType.CRON && job.cronExpression) {
      this.registerCronJob(schedulerKey, job);
    } else if (job.scheduleType === ScheduleType.INTERVAL && job.intervalMs) {
      this.registerIntervalJob(schedulerKey, job);
    } else {
      await this.persistNextRunAt(job, null);
      this.logger.warn('Job has no valid schedule configuration', {
        jobId: job.id,
        scheduleType: job.scheduleType,
      });
    }
  }

  unregisterJob(jobId: string): void {
    const schedulerKey = this.getSchedulerKey(jobId);

    try {
      if (this.schedulerRegistry.doesExist('cron', schedulerKey)) {
        this.schedulerRegistry.deleteCronJob(schedulerKey);
        this.logger.log('Unregistered cron job', { jobId });
      }
    } catch {
      // Job wasn't registered as cron
    }

    const intervalHandle = this.intervalHandles.get(jobId);
    if (intervalHandle) {
      clearInterval(intervalHandle);
      this.intervalHandles.delete(jobId);
      this.logger.log('Unregistered interval job', { jobId });
    }
  }

  async updateJob(job: ScheduledJob): Promise<void> {
    await this.registerJob(job);
  }

  private registerCronJob(schedulerKey: string, job: ScheduledJob): void {
    const cronJob = CronJob.from({
      cronTime: job.cronExpression!,
      onTick: () => this.executeJob(job.id),
      start: true,
    });

    this.schedulerRegistry.addCronJob(schedulerKey, cronJob);

    job.nextRunAt = this.scheduledJobTimingService.calculateNextRunAt(job);
    void this.persistNextRunAt(job, job.nextRunAt);

    this.logger.log('Registered cron job', {
      jobId: job.id,
      cronExpression: job.cronExpression,
      nextRun: job.nextRunAt?.toISOString(),
    });
  }

  private registerIntervalJob(schedulerKey: string, job: ScheduledJob): void {
    const handle = setInterval(() => this.executeJob(job.id), job.intervalMs!);

    this.intervalHandles.set(job.id, handle);

    job.nextRunAt = this.scheduledJobTimingService.calculateNextRunAt(job);
    void this.persistNextRunAt(job, job.nextRunAt);

    this.logger.log('Registered interval job', {
      jobId: job.id,
      intervalMs: job.intervalMs,
      nextRun: job.nextRunAt?.toISOString(),
    });
  }

  private executeJob(jobId: string): void {
    this.jobExecutor.execute(jobId, { scheduledTrigger: true }).catch((err) => {
      this.logger.error('Unhandled error during job execution', {
        jobId,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }

  private async loadAndRegisterAll(): Promise<void> {
    try {
      const jobs = await this.scheduledJobRepository.findEnabled();
      this.logger.log(`Loading ${jobs.length} enabled scheduled job(s)`);

      for (const job of jobs) {
        await this.registerJob(job);
      }
    } catch (err) {
      this.logger.error('Failed to load scheduled jobs on startup', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private unregisterAll(): void {
    for (const [jobId] of this.intervalHandles) {
      this.unregisterJob(jobId);
    }

    try {
      const cronJobs = this.schedulerRegistry.getCronJobs();
      for (const [key] of cronJobs) {
        if (key.startsWith(JOB_PREFIX)) {
          this.schedulerRegistry.deleteCronJob(key);
        }
      }
    } catch {
      // No cron jobs registered
    }
  }

  private getSchedulerKey(jobId: string): string {
    return `${JOB_PREFIX}${jobId}`;
  }

  private async persistNextRunAt(
    job: ScheduledJob,
    nextRunAt: Date | null,
  ): Promise<void> {
    job.nextRunAt = nextRunAt;
    await this.scheduledJobRepository.save(job).catch((err) => {
      this.logger.warn('Failed to persist nextRunAt', {
        jobId: job.id,
        error: err instanceof Error ? err.message : String(err),
      });
    });
  }
}
