import { Module } from '@nestjs/common';
import { TypedConfigModule, dotenvLoader } from 'nest-typed-config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResponseService } from './libs/response/response.service';
import { HttpExceptionFilter } from './libs/common/filters/http-exception.filter';
import { AppConfig } from './libs/config/app.config';
import { SessionsModule } from './interactors/sessions/sessions.module';
import { GatewaysModule } from './gateways/gateways.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    TypedConfigModule.forRoot({
      schema: AppConfig,
      load: dotenvLoader({
        separator: '_',
      }),
      isGlobal: true,
    }),
    SessionsModule,
    GatewaysModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ResponseService,
    HttpExceptionFilter,
  ],
})
export class AppModule {}
