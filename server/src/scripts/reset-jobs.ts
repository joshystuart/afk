import { DataSource } from 'typeorm';
import { typeormEntities } from '../database/database.config';
import { ScheduledJob } from '../domain/scheduled-jobs/scheduled-job.entity';
import { removeManagedLaunchAgentPlists } from '../interactors/scheduled-jobs/runtime/launchd.service';

/**
 * Deletes all scheduled jobs and their runs (including stream chunks).
 * Does not modify settings, sessions, or docker images.
 */
async function resetJobs(): Promise<void> {
  const dbPath = process.env.DB_SQLITE_DATABASE || 'afk.sqlite';
  console.log(`Connecting to database: ${dbPath}`);

  const removedLaunchAgents = removeManagedLaunchAgentPlists();
  console.log(`Removed ${removedLaunchAgents} AFK LaunchAgent plist(s).`);

  const dataSource = new DataSource({
    type: 'sqlite',
    database: dbPath,
    entities: typeormEntities,
    synchronize: false,
  });

  await dataSource.initialize();

  const jobRepo = dataSource.getRepository(ScheduledJob);
  const jobCount = await jobRepo.count();

  await dataSource.transaction(async (em) => {
    await em.createQueryBuilder().delete().from(ScheduledJob).execute();
  });

  console.log(
    `Removed ${jobCount} scheduled job(s) and all associated runs. Settings, sessions, and docker images were not modified.`,
  );

  await dataSource.destroy();
}

resetJobs().catch((error) => {
  console.error('Reset jobs failed:', error);
  process.exit(1);
});
