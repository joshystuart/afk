import { DataSource } from 'typeorm';
import { typeormEntities } from '../database/database.config';

async function resetDatabase(): Promise<void> {
  const dbPath = process.env.DB_SQLITE_DATABASE || 'afk.sqlite';
  console.log(`Connecting to database: ${dbPath}`);

  const dataSource = new DataSource({
    type: 'sqlite',
    database: dbPath,
    entities: typeormEntities,
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
