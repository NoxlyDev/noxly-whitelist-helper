import { pino, type Logger, type LoggerOptions } from 'pino';
import { BRAND } from './constants.js';

export type { Logger };

export interface LoggerConfig {
  level: string;
  pretty?: boolean;
}

export function createLogger({ level, pretty = false }: LoggerConfig): Logger {
  const options: LoggerOptions = {
    level,
    base: { app: BRAND },
    redact: {
      paths: ['token', 'DISCORD_TOKEN', '*.token', '*.DISCORD_TOKEN'],
      censor: '[redacted]',
    },
    ...(pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
          },
        }
      : {}),
  };
  return pino(options);
}

export function createSilentLogger(): Logger {
  return pino({ level: 'silent' });
}
