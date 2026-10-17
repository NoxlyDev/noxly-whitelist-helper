import { describe, expect, it, vi } from 'vitest';
import { evaluate } from '../../src/core/detection/evaluate.js';
import type { Signal } from '../../src/core/detection/types.js';
import type { Recipe } from '../../src/services/ocr/recipes.js';
import { runStage, type StageDeps } from '../../src/services/ocr/stage-runner.js';
import { createSilentLogger } from '../../src/shared/logger.js';
import sharp from 'sharp';

const signals: Signal[] = [
  { name: 'core', weight: 5, required: true, tolerance: 0, texts: ['target'] },
];
const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#000' } })
  .png()
  .toBuffer();
const recipe = (name: string): Recipe => ({ name, psm: 11, prepare: (b) => sharp(b) });

const deps = (recognize: StageDeps['recognize'], over: Partial<StageDeps> = {}): StageDeps => ({
  recognize,
  evaluate: (texts) => evaluate(texts, signals, 5),
  concurrency: 2,
  recipeTimeoutMs: 1000,
  logger: createSilentLogger(),
  ...over,
});

describe('runStage', () => {
  it('exits early on the first match and skips remaining recipes', async () => {
    const recognize = vi.fn(async () => 'this is the target text');
    const r = await runStage(
      [recipe('a'), recipe('b'), recipe('c'), recipe('d')],
      png,
      [],
      deps(recognize, { concurrency: 1 }),
    );
    expect(r.matched).toBe(true);
    expect(recognize).toHaveBeenCalledTimes(1);
  });

  it('runs every recipe when nothing matches', async () => {
    const recognize = vi.fn(async () => 'nothing');
    const texts: string[] = [];
    const r = await runStage([recipe('a'), recipe('b'), recipe('c')], png, texts, deps(recognize));
    expect(r.matched).toBe(false);
    expect(recognize).toHaveBeenCalledTimes(3);
    expect(texts).toHaveLength(3);
  });

  it('skips a failing recipe but still uses the others', async () => {
    let n = 0;
    const recognize = vi.fn(async () => {
      if (n++ === 0) throw new Error('worker crashed');
      return 'target';
    });
    const r = await runStage(
      [recipe('a'), recipe('b')],
      png,
      [],
      deps(recognize, { concurrency: 1 }),
    );
    expect(r.matched).toBe(true);
  });

  it('logs failures instead of swallowing them silently', async () => {
    const warn = vi.fn();
    const logger = { ...createSilentLogger(), warn } as unknown as StageDeps['logger'];
    await runStage(
      [recipe('a')],
      png,
      [],
      deps(
        async () => {
          throw new Error('x');
        },
        { logger },
      ),
    );
    expect(warn).toHaveBeenCalledOnce();
  });

  it('times out a hung recipe', async () => {
    const recognize = vi.fn(() => new Promise<string>(() => undefined));
    const r = await runStage([recipe('a')], png, [], deps(recognize, { recipeTimeoutMs: 20 }));
    expect(r.matched).toBe(false);
  });

  it('resolves immediately with no recipes', async () => {
    const r = await runStage(
      [],
      png,
      [],
      deps(async () => ''),
    );
    expect(r.matched).toBe(false);
  });

  it('respects the concurrency limit', async () => {
    let active = 0;
    let peak = 0;
    const recognize = async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 10));
      active--;
      return 'nothing';
    };
    await runStage(
      [recipe('a'), recipe('b'), recipe('c'), recipe('d')],
      png,
      [],
      deps(recognize, { concurrency: 2 }),
    );
    expect(peak).toBe(2);
  });
});
