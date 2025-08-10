import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const errorResponse = exception.getResponse();

      if (typeof errorResponse === 'string') {
        message = errorResponse;
      } else if (typeof errorResponse === 'object') {
        message = (errorResponse as any).message || message;
        code = (errorResponse as any).code || code;
      }
    } else if (exception instanceof Error) {
      message = exception.message;

      // Log full error for non-HTTP exceptions
      this.logger.error('Unhandled exception', {
        error: exception,
        stack: exception.stack,
        request: {
          method: request.method,
          url: request.url,
          body: request.body,
        },
      });
    }

    const errorResponse = {
      success: false,
      error: {
        message,
        code,
        timestamp: new Date().toISOString(),
      },
      statusCode: status,
    };

    response.status(status).json(errorResponse);
  }
}
