import { statSync, writeFileSync } from 'node:fs';
import type { Logger } from './logger.js';

export interface HeartbeatOptions {
  file: string;
  intervalMs: number;
  isHealthy: () => boolean;
  logger: Logger;
}

/** Touches a file periodically while healthy; a container HEALTHCHECK reads its freshness. */
export function startHeartbeat({
  file,
  intervalMs,
  isHealthy,
  logger,
}: HeartbeatOptions): () => void {
  let failing = false;
  const beat = () => {
    if (!isHealthy()) return;
    try {
      writeFileSync(file, String(Date.now()));
      failing = false;
    } catch (err) {
      // Warn once per failure episode instead of every interval.
      if (!failing) logger.warn({ err, file }, 'could not write heartbeat file; check HEALTH_FILE');
      failing = true;
    }
  };
  beat();
  const timer = setInterval(beat, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}

export function isHeartbeatFresh(
  file: string,
  maxAgeMs: number,
  now: number = Date.now(),
): boolean {
  try {
    return now - statSync(file).mtimeMs <= maxAgeMs;
  } catch {
    return false;
  }
}
