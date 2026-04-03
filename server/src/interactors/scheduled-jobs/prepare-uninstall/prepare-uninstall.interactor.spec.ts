import { ScheduledJob } from '../../../domain/scheduled-jobs/scheduled-job.entity';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { JobSchedulerService } from '../runtime/job-scheduler.service';
import { LaunchdService } from '../runtime/launchd.service';
import { PrepareUninstallInteractor } from './prepare-uninstall.interactor';

describe('PrepareUninstallInteractor', () => {
  let interactor: PrepareUninstallInteractor;
  let scheduledJobRepository: jest.Mocked<ScheduledJobRepository>;
  let jobScheduler: jest.Mocked<JobSchedulerService>;
  let launchdService: jest.Mocked<LaunchdService>;

  beforeEach(() => {
    scheduledJobRepository = {
      findAll: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<ScheduledJobRepository>;

    jobScheduler = {
      unregisterJob: jest.fn(),
    } as unknown as jest.Mocked<JobSchedulerService>;

    launchdService = {
      removeAllManagedPlists: jest.fn(),
    } as unknown as jest.Mocked<LaunchdService>;

    interactor = new PrepareUninstallInteractor(
      scheduledJobRepository,
      jobScheduler,
      launchdService,
    );
  });

  it('disables enabled jobs and removes AFK launch agents', async () => {
    const enabledJob = Object.assign(new ScheduledJob(), {
      id: 'job-enabled',
      enabled: true,
      nextRunAt: new Date('2026-03-28T12:00:00.000Z'),
    });
    const disabledJob = Object.assign(new ScheduledJob(), {
      id: 'job-disabled',
      enabled: false,
      nextRunAt: null,
    });

    scheduledJobRepository.findAll.mockResolvedValue([enabledJob, disabledJob]);
    launchdService.removeAllManagedPlists.mockResolvedValue(3);

    const result = await interactor.execute();

    expect(jobScheduler.unregisterJob).toHaveBeenCalledWith('job-enabled');
    expect(jobScheduler.unregisterJob).toHaveBeenCalledWith('job-disabled');
    expect(enabledJob.enabled).toBe(false);
    expect(enabledJob.nextRunAt).toBeNull();
    expect(scheduledJobRepository.save).toHaveBeenCalledTimes(1);
    expect(scheduledJobRepository.save).toHaveBeenCalledWith(enabledJob);
    expect(launchdService.removeAllManagedPlists).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      disabledJobs: 1,
      removedLaunchAgents: 3,
    });
  });
});
