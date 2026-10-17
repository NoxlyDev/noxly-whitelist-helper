import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/config/env.js';
import { ConfigError } from '../../src/shared/errors.js';
import { parseSignals } from '../../src/config/signals.js';

const TOKEN = 'abc.def.ghi';

describe('parseEnv', () => {
  it('applies defaults', () => {
    const env = parseEnv({ DISCORD_TOKEN: TOKEN });
    expect(env).toMatchObject({
      DISCORD_TOKEN: TOKEN,
      CHANNEL_IDS: [],
      COOLDOWN_SECONDS: 15,
      LOG_LEVEL: 'info',
      MAX_IMAGE_BYTES: 8 * 1024 * 1024,
      FETCH_TIMEOUT_MS: 10_000,
      NODE_ENV: 'development',
    });
    expect(env.OCR_CONCURRENCY).toBeUndefined();
    expect(env.HEALTH_FILE).toBeUndefined(); // heartbeat is opt-in
  });

  it('fails fast without a token and names the variable', () => {
    expect(() => parseEnv({})).toThrow(ConfigError);
    expect(() => parseEnv({})).toThrow(/DISCORD_TOKEN/);
  });

  it('rejects a blank token', () => {
    expect(() => parseEnv({ DISCORD_TOKEN: '   ' })).toThrow(/DISCORD_TOKEN/);
  });

  it('parses a comma-separated channel list and trims entries', () => {
    const env = parseEnv({
      DISCORD_TOKEN: TOKEN,
      CHANNEL_IDS: '123456789012345678, 234567890123456789 ,',
    });
    expect(env.CHANNEL_IDS).toEqual(['123456789012345678', '234567890123456789']);
  });

  it('rejects malformed channel IDs', () => {
    expect(() => parseEnv({ DISCORD_TOKEN: TOKEN, CHANNEL_IDS: 'general' })).toThrow(/CHANNEL_IDS/);
  });

  it('treats empty strings as unset', () => {
    const env = parseEnv({
      DISCORD_TOKEN: TOKEN,
      CHANNEL_IDS: '',
      COOLDOWN_SECONDS: '',
      OCR_CONCURRENCY: '',
      LOG_LEVEL: '',
    });
    expect(env.CHANNEL_IDS).toEqual([]);
    expect(env.COOLDOWN_SECONDS).toBe(15);
    expect(env.OCR_CONCURRENCY).toBeUndefined();
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('coerces numbers and allows a zero cooldown', () => {
    expect(parseEnv({ DISCORD_TOKEN: TOKEN, COOLDOWN_SECONDS: '0' }).COOLDOWN_SECONDS).toBe(0);
    expect(parseEnv({ DISCORD_TOKEN: TOKEN, OCR_CONCURRENCY: '2' }).OCR_CONCURRENCY).toBe(2);
  });

  it('rejects invalid numbers and log levels', () => {
    expect(() => parseEnv({ DISCORD_TOKEN: TOKEN, COOLDOWN_SECONDS: '-1' })).toThrow(
      /COOLDOWN_SECONDS/,
    );
    expect(() => parseEnv({ DISCORD_TOKEN: TOKEN, COOLDOWN_SECONDS: 'abc' })).toThrow(
      /COOLDOWN_SECONDS/,
    );
    expect(() => parseEnv({ DISCORD_TOKEN: TOKEN, LOG_LEVEL: 'loud' })).toThrow(/LOG_LEVEL/);
  });

  it('reports every problem at once', () => {
    try {
      parseEnv({ COOLDOWN_SECONDS: 'x' });
      expect.unreachable();
    } catch (e) {
      expect((e as Error).message).toMatch(/DISCORD_TOKEN[\s\S]*COOLDOWN_SECONDS/);
    }
  });
});

describe('parseSignals', () => {
  const ok = { minScore: 2, signals: [{ name: 'a', weight: 2, texts: ['x'] }] };

  it('accepts a valid config', () => {
    expect(parseSignals(ok).minScore).toBe(2);
  });
  it('rejects duplicate names', () => {
    const bad = { minScore: 1, signals: [ok.signals[0], ok.signals[0]] };
    expect(() => parseSignals(bad)).toThrow(/duplicate/);
  });
  it('rejects an unreachable minScore', () => {
    expect(() => parseSignals({ ...ok, minScore: 99 })).toThrow(/exceeds total weight/);
  });
  it('rejects empty text variants', () => {
    expect(() =>
      parseSignals({ minScore: 1, signals: [{ name: 'a', weight: 1, texts: [] }] }),
    ).toThrow(ConfigError);
  });
});
