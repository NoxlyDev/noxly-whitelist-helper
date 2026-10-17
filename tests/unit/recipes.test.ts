import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { STAGE1, STAGE2 } from '../../src/services/ocr/recipes.js';

describe('OCR recipes', () => {
  const input = sharp({
    create: { width: 64, height: 48, channels: 4, background: { r: 20, g: 20, b: 20, alpha: 0.5 } },
  }).png();

  it('uses only supported page-segmentation modes and unique names', () => {
    const all = [...STAGE1, ...STAGE2];
    expect(all.every((r) => r.psm === 6 || r.psm === 11)).toBe(true);
    expect(new Set(all.map((r) => r.name)).size).toBe(all.length);
  });

  it('stage 1 is a small, fast set; stage 2 is the heavier fallback', () => {
    expect(STAGE1).toHaveLength(3);
    expect(STAGE2.length).toBeGreaterThan(STAGE1.length);
  });

  it.each([...STAGE1, ...STAGE2].map((r) => [r.name, r] as const))(
    '%s produces a valid greyscale PNG',
    async (_name, recipe) => {
      const png = await recipe
        .prepare(await input.toBuffer())
        .png()
        .toBuffer();
      const meta = await sharp(png).metadata();
      expect(meta.format).toBe('png');
      expect(meta.width).toBeGreaterThan(0);
    },
  );
});
