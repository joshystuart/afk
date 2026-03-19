import { DataSource } from 'typeorm';
import { typeormEntities } from '../database/database.config';
import { ChatMessage } from '../domain/chat/chat-message.entity';
import { Session } from '../domain/sessions/session.entity';

/**
 * Deletes all sessions and chat data (messages + stream chunks).
 * Does not modify settings, docker images, or scheduled jobs.
 */
async function resetSessions(): Promise<void> {
  const dbPath = process.env.DB_SQLITE_DATABASE || 'afk.sqlite';
  console.log(`Connecting to database: ${dbPath}`);

  const dataSource = new DataSource({
    type: 'sqlite',
    database: dbPath,
    entities: typeormEntities,
    synchronize: false,
  });

  await dataSource.initialize();

  const msgRepo = dataSource.getRepository(ChatMessage);
  const sessionRepo = dataSource.getRepository(Session);

  const msgCount = await msgRepo.count();
  const sessionCount = await sessionRepo.count();

  await dataSource.transaction(async (em) => {
    await em.createQueryBuilder().delete().from(ChatMessage).execute();
    await em.createQueryBuilder().delete().from(Session).execute();
  });

  console.log(
    `Removed ${msgCount} chat message(s) and ${sessionCount} session(s). Settings, docker images, and scheduled jobs were not modified.`,
  );

  await dataSource.destroy();
}

resetSessions().catch((error) => {
  console.error('Reset sessions failed:', error);
  process.exit(1);
});
