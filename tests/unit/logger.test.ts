import { describe, expect, it } from 'vitest';
import { createLogger, createSilentLogger } from '../../src/shared/logger.js';

describe('logger', () => {
  it('honours the configured level', () => {
    expect(createLogger({ level: 'warn' }).level).toBe('warn');
  });
  it('silent logger never emits', () => {
    expect(createSilentLogger().level).toBe('silent');
  });
  it('can be created in pretty mode', () => {
    const l = createLogger({ level: 'silent', pretty: true });
    expect(typeof l.info).toBe('function');
  });
});
