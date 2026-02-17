import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseService } from './libs/response/response.service';
import { HttpExceptionFilter } from './libs/common/filters/http-exception.filter';
import { ConfigModule } from './libs/config/config.module';
import { SessionsModule } from './interactors/sessions/sessions.module';
import { SettingsModule } from './interactors/settings/settings.module';
import { GatewaysModule } from './gateways/gateways.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { getDatabaseConfig } from './database/database.config';
import { LoggerModule } from './libs/logger/logger.module';
import { GitHubModule } from './libs/github/github.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({})
export class AppModule {
  static forRoot(options?: { configPath?: string }) {
    return {
      module: AppModule,
      imports: [
        ConfigModule.forRoot({ path: options?.configPath }),
        TypeOrmModule.forRoot(getDatabaseConfig()),
        EventEmitterModule.forRoot(),
        LoggerModule.forRootAsync(),
        AuthModule,
        SessionsModule,
        SettingsModule,
        GatewaysModule,
        HealthModule,
        GitHubModule,
      ],
      controllers: [],
      providers: [ResponseService, HttpExceptionFilter],
    };
  }
}
