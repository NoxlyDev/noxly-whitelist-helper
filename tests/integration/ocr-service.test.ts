import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TESSDATA_DIR } from '../../src/config/paths.js';
import { loadSignals } from '../../src/config/signals.js';
import { createOcrService, type OcrService } from '../../src/services/ocr/ocr-service.js';
import { createSilentLogger } from '../../src/shared/logger.js';

const FIXTURES = join(import.meta.dirname, '../fixtures');
const files = (dir: string) =>
  readdirSync(join(FIXTURES, dir))
    .filter((f) => /\.(png|jpe?g|webp)$/.test(f))
    .map((f) => [f, readFileSync(join(FIXTURES, dir, f))] as const);

let ocr: OcrService;

beforeAll(async () => {
  const { signals, minScore } = loadSignals();
  ocr = createOcrService({
    signals,
    minScore,
    langPath: TESSDATA_DIR,
    logger: createSilentLogger(),
    recipeTimeoutMs: 60_000,
  });
  await ocr.warmup();
});

afterAll(async () => {
  await ocr.shutdown();
});

// Regression suite: every fixture has a fixed expectation (baseline taken from the pre-refactor code).
describe('OCR regression (fixtures)', () => {
  it.each(files('positive'))('detects the dialog in positive/%s', async (_name, buf) => {
    const r = await ocr.analyze(buf);
    expect(r.requiredOk).toBe(true);
    expect(r.matched).toBe(true);
  });

  it.each(files('negative'))(
    'does NOT match negative/%s (no false positive)',
    async (_name, buf) => {
      const r = await ocr.analyze(buf);
      expect(r.matched).toBe(false);
    },
  );

  it('exposes timing and stage metadata', async () => {
    const [, buf] = files('positive')[0]!;
    const r = await ocr.analyze(buf);
    expect([1, 2]).toContain(r.stage);
    expect(r.ms).toBeGreaterThan(0);
    expect(r.detail.length).toBeGreaterThan(0);
  });

  it('honours stage1Only', async () => {
    const [, buf] = files('negative')[0]!;
    const r = await ocr.analyze(buf, { stage1Only: true });
    expect(r.stage).toBe(1);
  });
});
