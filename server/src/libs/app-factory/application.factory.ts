import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';

export interface ApplicationOptions {
  enableCors?: boolean;
  globalPrefix?: string;
  enableLogging?: boolean;
}

export class ApplicationFactory {
  static configure(
    app: INestApplication,
    options: ApplicationOptions = {},
  ): INestApplication {
    const {
      enableCors = true,
      globalPrefix = 'api',
      enableLogging = true,
    } = options;

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    if (enableCors) {
      app.enableCors();
    }

    if (globalPrefix) {
      app.setGlobalPrefix(globalPrefix);
    }

    return app;
  }

  /**
   * Configure application for testing with minimal logging and disabled external features
   */
  static configureForTesting(app: INestApplication): INestApplication {
    return this.configure(app, {
      enableCors: true,
      globalPrefix: 'api',
      enableLogging: false,
    });
  }
}
