import { Global, Module, DynamicModule } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LoggerConfig } from '../config/logger.config';
import { Logger } from './logger';

@Global()
@Module({})
export class LoggerModule {
  static forRootAsync(): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        PinoLoggerModule.forRootAsync({
          useFactory: (loggerConfig: LoggerConfig) => {
            const transport = loggerConfig.prettyPrint
              ? {
                  target: 'pino-pretty',
                }
              : undefined;
            return {
              forRoutes: ['/none'],
              pinoHttp: {
                transport,
                level: loggerConfig.level,
              },
            };
          },
          inject: [LoggerConfig],
        }),
      ],
      providers: [Logger],
      exports: [Logger],
    };
  }
}
