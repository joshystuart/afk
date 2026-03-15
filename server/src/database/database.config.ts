import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Session } from '../domain/sessions/session.entity';
import { Settings } from '../domain/settings/settings.entity';
import { ChatMessage } from '../domain/chat/chat-message.entity';
import { DockerImage } from '../domain/docker-images/docker-image.entity';
import { DatabaseConfig } from '../libs/config/database/database.config';

const entities = [Session, Settings, ChatMessage, DockerImage];

export const createTypeOrmOptions = (
  databaseConfig: DatabaseConfig,
): TypeOrmModuleOptions => {
  const { type } = databaseConfig;

  switch (type) {
    case 'postgres': {
      const postgresConfig = databaseConfig.postgres;
      if (!postgresConfig) {
        throw new Error(
          'PostgreSQL configuration is missing. Please configure database.postgres in your YAML config.',
        );
      }
      return {
        type: 'postgres',
        host: postgresConfig.host,
        port: postgresConfig.port,
        username: postgresConfig.username,
        password: postgresConfig.password,
        database: postgresConfig.database,
        entities,
        synchronize: postgresConfig.synchronize ?? false,
        logging: postgresConfig.logging ?? false,
      };
    }
    case 'sqlite': {
      const sqliteConfig = databaseConfig.sqlite;
      if (!sqliteConfig) {
        throw new Error(
          'SQLite configuration is missing. Please configure database.sqlite in your YAML config.',
        );
      }
      return {
        type: 'sqlite',
        database: sqliteConfig.database,
        entities,
        synchronize: sqliteConfig.synchronize ?? true,
        logging: sqliteConfig.logging ?? false,
      };
    }
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
};
