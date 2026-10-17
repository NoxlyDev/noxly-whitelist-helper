import { z } from 'zod';
import { ConfigError } from '../shared/errors.js';
import {
  DEFAULT_COOLDOWN_SECONDS,
  DEFAULT_FETCH_TIMEOUT_MS,
  DEFAULT_MAX_IMAGE_BYTES,
  DEFAULT_OCR_RECIPE_TIMEOUT_MS,
} from '../shared/constants.js';

// Empty string in .env (e.g. `OCR_CONCURRENCY=`) must behave like "unset".
const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const intWithDefault = (min: number, def: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).default(def));

const optionalInt = (min: number) =>
  z.preprocess(emptyToUndefined, z.coerce.number().int().min(min).optional());

const channelId = z.string().regex(/^\d{17,20}$/, 'must be a numeric Discord ID (17-20 digits)');

const channelIds = z.preprocess(
  (v) =>
    typeof v === 'string'
      ? v
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean)
      : v,
  z.array(channelId).default([]),
);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DISCORD_TOKEN: z.string().trim().min(1, 'is required'),
  CHANNEL_IDS: channelIds,
  COOLDOWN_SECONDS: intWithDefault(0, DEFAULT_COOLDOWN_SECONDS),
  LOG_LEVEL: z.preprocess(
    emptyToUndefined,
    z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  ),
  MAX_IMAGE_BYTES: intWithDefault(1, DEFAULT_MAX_IMAGE_BYTES),
  FETCH_TIMEOUT_MS: intWithDefault(1, DEFAULT_FETCH_TIMEOUT_MS),
  OCR_CONCURRENCY: optionalInt(1),
  // Opt-in: only set by the Docker image. Leave unset on Windows / local runs.
  HEALTH_FILE: z.preprocess(emptyToUndefined, z.string().trim().optional()),
  OCR_RECIPE_TIMEOUT_MS: intWithDefault(1, DEFAULT_OCR_RECIPE_TIMEOUT_MS),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (result.success) return result.data;

  const lines = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`);
  throw new ConfigError(
    `Invalid environment configuration:\n${lines.join('\n')}\n` +
      'Copy .env.example to .env and fill in the values (see docs/configuration.md).',
  );
}
