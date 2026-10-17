import { existsSync, mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isHeartbeatFresh, startHeartbeat } from '../../src/shared/health.js';
import { createSilentLogger, type Logger } from '../../src/shared/logger.js';

const dir = mkdtempSync(join(tmpdir(), 'noxly-health-'));
afterEach(() => rmSync(join(dir, 'beat'), { force: true }));

describe('heartbeat', () => {
  it('writes the file only while healthy', () => {
    const file = join(dir, 'beat');
    const stop = startHeartbeat({
      file,
      intervalMs: 10_000,
      isHealthy: () => false,
      logger: createSilentLogger(),
    });
    expect(existsSync(file)).toBe(false);
    stop();
    const stop2 = startHeartbeat({
      file,
      intervalMs: 10_000,
      isHealthy: () => true,
      logger: createSilentLogger(),
    });
    expect(existsSync(file)).toBe(true);
    stop2();
  });

  it('does not throw when the file cannot be written', () => {
    const stop = startHeartbeat({
      file: join(dir, 'missing-dir', 'beat'),
      intervalMs: 10_000,
      isHealthy: () => true,
      logger: createSilentLogger(),
    });
    stop();
  });

  it('warns only once when the path is a directory (EISDIR)', () => {
    vi.useFakeTimers();
    const folder = join(dir, 'a-folder');
    mkdirSync(folder, { recursive: true });
    const warn = vi.fn();
    const logger = { ...createSilentLogger(), warn } as unknown as Logger;
    const stop = startHeartbeat({ file: folder, intervalMs: 1000, isHealthy: () => true, logger });
    vi.advanceTimersByTime(5000);
    stop();
    vi.useRealTimers();
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('reports freshness by file age', () => {
    const file = join(dir, 'beat');
    expect(isHeartbeatFresh(file, 1000)).toBe(false);
    writeFileSync(file, 'x');
    expect(isHeartbeatFresh(file, 1000)).toBe(true);
    const old = new Date(Date.now() - 60_000);
    utimesSync(file, old, old);
    expect(isHeartbeatFresh(file, 1000)).toBe(false);
  });
});
