import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ResponseService } from './libs/response/response.service';
import { HttpExceptionFilter } from './libs/common/filters/http-exception.filter';
import { ConfigModule } from './libs/config/config.module';
import { SessionsModule } from './interactors/sessions/sessions.module';
import { SettingsModule } from './interactors/settings/settings.module';
import { GatewaysModule } from './gateways/gateways.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './libs/auth/auth.module';
import { createTypeOrmOptions } from './database/database.config';
import { DatabaseConfig } from './libs/config/database/database.config';
import { LoggerModule } from './libs/logger/logger.module';
import { GitHubModule } from './libs/github/github.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DockerImagesModule } from './domain/docker-images/docker-images.module';
import { DockerImagesInteractorModule } from './interactors/docker-images/docker-images.module';

export interface AppModuleOptions {
  configPath?: string;
  staticAssetsPath?: string;
}

@Module({})
export class AppModule {
  static forRoot(options?: AppModuleOptions): DynamicModule {
    const imports: DynamicModule['imports'] = [
      ConfigModule.forRoot({ path: options?.configPath }),
      TypeOrmModule.forRootAsync({
        inject: [DatabaseConfig],
        useFactory: (databaseConfig: DatabaseConfig) =>
          createTypeOrmOptions(databaseConfig),
      }),
      EventEmitterModule.forRoot(),
      LoggerModule.forRootAsync(),
      AuthModule,
      SessionsModule,
      SettingsModule,
      GatewaysModule,
      HealthModule,
      GitHubModule,
      DockerImagesModule,
      DockerImagesInteractorModule,
    ];

    if (options?.staticAssetsPath) {
      imports.push(
        ServeStaticModule.forRoot({
          rootPath: options.staticAssetsPath,
          exclude: ['/api/(.*)', '/socket.io/(.*)'],
        }),
      );
    }

    return {
      module: AppModule,
      imports,
      controllers: [],
      providers: [ResponseService, HttpExceptionFilter],
    };
  }
}
