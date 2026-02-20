import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { AuthGuard } from '../auth/auth.guard';

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

    // Set up global auth guard
    const authGuard = app.get(AuthGuard);
    const reflector = app.get(Reflector);
    app.useGlobalGuards(authGuard);

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
