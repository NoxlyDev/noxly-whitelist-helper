import { createApp } from './app.js';
import { loadConfig } from './config/index.js';
import { describeEnvFile, loadEnvFile } from './config/load-env.js';
import { ConfigError } from './shared/errors.js';
import { createLogger } from './shared/logger.js';

function bootstrap() {
  const envFile = loadEnvFile();
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    // Logger isn't available yet (it depends on config), so write directly to stderr.
    const detail = err instanceof ConfigError ? err.message : String(err);
    process.stderr.write(`${detail}\n${describeEnvFile(envFile)}\n`);
    process.exit(1);
  }

  const logger = createLogger({
    level: config.env.LOG_LEVEL,
    pretty: config.env.NODE_ENV !== 'production',
  });
  const app = createApp(config, logger);

  let shuttingDown = false;
  const shutdown = async (reason: string, code = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ reason }, 'shutting down');
    // Hard stop if graceful shutdown hangs.
    setTimeout(() => process.exit(code || 1), 10_000).unref();
    try {
      await app.stop();
    } catch (err) {
      logger.error({ err }, 'error during shutdown');
      code = code || 1;
    }
    process.exit(code);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (err) => {
    logger.fatal({ err }, 'unhandled rejection');
    void shutdown('unhandledRejection', 1);
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaught exception');
    void shutdown('uncaughtException', 1);
  });

  app.start().catch((err: unknown) => {
    logger.fatal({ err }, 'failed to start');
    void shutdown('startFailure', 1);
  });
}

bootstrap();
