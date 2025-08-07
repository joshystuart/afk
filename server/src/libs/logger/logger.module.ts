import { Global, Module, DynamicModule } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { LoggerConfig } from '../config/logger.config';

@Global()
@Module({})
export class LoggerModule {
  static forRootAsync(): DynamicModule {
    return {
      module: LoggerModule,
      imports: [
        PinoLoggerModule.forRootAsync({
          useFactory: (config: LoggerConfig) => ({
            pinoHttp: {
              level: config.level,
              transport: config.pretty
                ? {
                    target: 'pino-pretty',
                    options: {
                      colorize: true,
                      singleLine: true,
                    },
                  }
                : undefined,
              serializers: {
                req: (req: any) => ({
                  method: req.method,
                  url: req.url,
                  query: req.query,
                  params: req.params,
                }),
                res: (res: any) => ({
                  statusCode: res.statusCode,
                }),
              },
              customProps: (req: any) => ({
                context: 'HTTP',
                userId: req.user?.id,
              }),
            },
          }),
          inject: [LoggerConfig],
        }),
      ],
      exports: [PinoLoggerModule],
    };
  }
}