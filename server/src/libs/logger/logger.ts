import { Injectable, Logger as NestJsLogger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class Logger extends NestJsLogger {
  /**
   * Log a message with optional context metadata
   * @param message The message to log
   * @param context Additional context data to include in the log
   */
  log(message: any, context?: string | object): void {
    if (typeof context === 'string') {
      super.log(message, context);
    } else if (context) {
      // Convert object context to string to work with NestJS logger
      const contextStr = this.context || 'Logger';
      super.log(`${message} ${JSON.stringify(context)}`, contextStr);
    } else {
      super.log(message);
    }
  }

  /**
   * Log a warning with optional context metadata
   * @param message The message to log
   * @param context Additional context data to include in the log
   */
  warn(message: any, context?: string | object): void {
    if (typeof context === 'string') {
      super.warn(message, context);
    } else if (context) {
      const contextStr = this.context || 'Logger';
      super.warn(`${message} ${JSON.stringify(context)}`, contextStr);
    } else {
      super.warn(message);
    }
  }

  /**
   * Log an error with optional context metadata
   * @param message The message to log
   * @param context Additional context data to include in the log
   */
  error(message: any, context?: string | object): void {
    if (typeof context === 'string') {
      super.error(message, context);
    } else if (context) {
      const contextStr = this.context || 'Logger';
      super.error(`${message} ${JSON.stringify(context)}`, contextStr);
    } else {
      super.error(message);
    }
  }

  /**
   * Log debug information with optional context metadata
   * @param message The message to log
   * @param context Additional context data to include in the log
   */
  debug(message: any, context?: string | object): void {
    if (typeof context === 'string') {
      super.debug(message, context);
    } else if (context) {
      const contextStr = this.context || 'Logger';
      super.debug(`${message} ${JSON.stringify(context)}`, contextStr);
    } else {
      super.debug(message);
    }
  }

  /**
   * Log verbose information with optional context metadata
   * @param message The message to log
   * @param context Additional context data to include in the log
   */
  verbose(message: any, context?: string | object): void {
    if (typeof context === 'string') {
      super.verbose(message, context);
    } else if (context) {
      const contextStr = this.context || 'Logger';
      super.verbose(`${message} ${JSON.stringify(context)}`, contextStr);
    } else {
      super.verbose(message);
    }
  }
}
