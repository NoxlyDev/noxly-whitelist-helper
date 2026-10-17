import type { Client } from 'discord.js';
import type { AppConfig } from './config/index.js';
import { TESSDATA_DIR } from './config/paths.js';
import { createClient } from './discord/client.js';
import { createMessageHandler } from './discord/events/message-create.js';
import { registerEvents } from './discord/events/index.js';
import { InMemoryCooldownStore } from './services/cooldown/cooldown-store.js';
import { createImageFetcher } from './services/image/image-fetcher.js';
import { createOcrService, type OcrService } from './services/ocr/ocr-service.js';
import { ALLOWED_IMAGE_HOSTS, HEARTBEAT_INTERVAL_MS } from './shared/constants.js';
import { startHeartbeat } from './shared/health.js';
import type { Logger } from './shared/logger.js';

export interface App {
  start(): Promise<void>;
  stop(): Promise<void>;
}

/** Composition root: wires every dependency together. No side effects until `start()`. */
export function createApp(config: AppConfig, logger: Logger): App {
  const { env, detection } = config;

  const ocr: OcrService = createOcrService({
    signals: detection.signals,
    minScore: detection.minScore,
    langPath: TESSDATA_DIR,
    logger,
    ...(env.OCR_CONCURRENCY !== undefined ? { concurrency: env.OCR_CONCURRENCY } : {}),
    recipeTimeoutMs: env.OCR_RECIPE_TIMEOUT_MS,
  });

  const handleMessage = createMessageHandler({
    channelIds: env.CHANNEL_IDS,
    minScore: detection.minScore,
    cooldown: new InMemoryCooldownStore(env.COOLDOWN_SECONDS * 1000),
    fetchImage: createImageFetcher({
      timeoutMs: env.FETCH_TIMEOUT_MS,
      maxBytes: env.MAX_IMAGE_BYTES,
      allowedHosts: ALLOWED_IMAGE_HOSTS,
    }),
    analyze: (buffer) => ocr.analyze(buffer),
    logger,
  });

  let client: Client | null = null;
  let stopped = false;
  let stopHeartbeat: (() => void) | null = null;

  return {
    async start() {
      // Pre-warm OCR workers first so the very first image is fast.
      await ocr.warmup();
      logger.info('OCR ready');
      if (stopped) return; // shutdown requested while warming up

      client = createClient();
      registerEvents(client, handleMessage, logger);
      await client.login(env.DISCORD_TOKEN);

      if (env.HEALTH_FILE) {
        const c = client;
        stopHeartbeat = startHeartbeat({
          file: env.HEALTH_FILE,
          intervalMs: HEARTBEAT_INTERVAL_MS,
          isHealthy: () => c.isReady(),
          logger,
        });
      }
    },

    async stop() {
      stopped = true;
      stopHeartbeat?.();
      await client?.destroy();
      await ocr.shutdown();
    },
  };
}
