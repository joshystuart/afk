import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduleType } from '../../../domain/scheduled-jobs/schedule-type.enum';

@Injectable()
export class ScheduledJobTimingService {
  calculateNextRunAt(
    job: ScheduledJob,
    options: { fromDate?: Date } = {},
  ): Date | null {
    if (!job.enabled) {
      return null;
    }

    if (job.scheduleType === ScheduleType.CRON && job.cronExpression) {
      const cronJob = CronJob.from({
        cronTime: job.cronExpression,
        onTick: () => undefined,
        start: false,
      });
      const nextDate = cronJob.nextDate();
      return nextDate ? nextDate.toJSDate() : null;
    }

    if (job.scheduleType === ScheduleType.INTERVAL && job.intervalMs) {
      const baseTime = options.fromDate ?? new Date();
      return new Date(baseTime.getTime() + job.intervalMs);
    }

    return null;
  }
}
