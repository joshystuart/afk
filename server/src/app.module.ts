import { Module } from '@nestjs/common';
import { TypedConfigModule, dotenvLoader } from 'nest-typed-config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseService } from './libs/response/response.service';
import { HttpExceptionFilter } from './libs/common/filters/http-exception.filter';
import { AppConfig } from './libs/config/app.config';
import { SessionsModule } from './interactors/sessions/sessions.module';
import { SettingsModule } from './interactors/settings/settings.module';
import { GatewaysModule } from './gateways/gateways.module';
import { HealthModule } from './health/health.module';
import { getDatabaseConfig } from './database/database.config';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: AppConfig,
      load: dotenvLoader({
        separator: '_',
      }),
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    SessionsModule,
    SettingsModule,
    GatewaysModule,
    HealthModule,
  ],
  controllers: [],
  providers: [ResponseService, HttpExceptionFilter],
})
export class AppModule {}
