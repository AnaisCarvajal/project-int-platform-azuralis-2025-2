import { Logger } from '@nestjs/common';
import * as winston from 'winston';

/**
 * Logger configuration for production and development environments.
 * Implements structured logging with Winston for backend operations,
 * errors, and performance monitoring.
 */
export const createLogger = () => {
  const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

  return winston.createLogger({
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    ),
    defaultMeta: { service: 'azuralis-backend' },
    transports: [
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
    ],
  });
};

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  const logger = createLogger();
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...meta }) => {
          return `${timestamp} [${level}]: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
          }`;
        }),
      ),
    }),
  );
}

/**
 * NestJS Logger service adapter for Winston.
 * Provides compatibility with NestJS logging interface.
 */
export class WinstonLogger extends Logger {
  private logger = createLogger();

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.debug(message, { context });
  }
}
