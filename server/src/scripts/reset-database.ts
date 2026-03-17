import { DataSource } from 'typeorm';
import { Session } from '../domain/sessions/session.entity';
import { Settings } from '../domain/settings/settings.entity';
import { ChatMessage } from '../domain/chat/chat-message.entity';
import { DockerImage } from '../domain/docker-images/docker-image.entity';

async function resetDatabase(): Promise<void> {
  const dbPath = process.env.DB_SQLITE_DATABASE || 'afk.sqlite';
  console.log(`Connecting to database: ${dbPath}`);

  const dataSource = new DataSource({
    type: 'sqlite',
    database: dbPath,
    entities: [Session, Settings, ChatMessage, DockerImage],
    synchronize: false,
  });

  await dataSource.initialize();

  console.log('Dropping all tables...');
  await dataSource.dropDatabase();

  console.log('Recreating schema...');
  await dataSource.synchronize();

  console.log('Database reset complete. All data has been cleared.');
  await dataSource.destroy();
}

resetDatabase().catch((error) => {
  console.error('Database reset failed:', error);
  process.exit(1);
});
