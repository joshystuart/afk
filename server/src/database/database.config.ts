import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Session } from '../domain/sessions/session.entity';
import { Settings } from '../domain/settings/settings.entity';

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'sqlite',
  database: process.env.DB_DATABASE || 'afk.sqlite',
  entities: [Session, Settings],
  synchronize: true, // Only for development - use migrations in production
  logging: process.env.NODE_ENV === 'development',
};

// Alternative configuration for PostgreSQL (for easy swapping)
export const postgresConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'afk',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'afk',
  entities: [Session, Settings],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
};

// Export the configuration to use (can be changed via environment variable)
export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const dbType = process.env.DATABASE_TYPE || 'sqlite';

  switch (dbType) {
    case 'postgres':
      return {
        ...postgresConfig,
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'afk',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'afk',
      };
    case 'sqlite':
    default:
      return {
        ...databaseConfig,
        database: process.env.DB_DATABASE || 'afk.sqlite',
      };
  }
};
