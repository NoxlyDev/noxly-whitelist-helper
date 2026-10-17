import { describe, expect, it } from 'vitest';
import { evaluate } from '../../src/core/detection/evaluate.js';
import { hasHint } from '../../src/core/detection/hint.js';
import type { Signal } from '../../src/core/detection/types.js';
import { loadSignals } from '../../src/config/signals.js';

const signals: Signal[] = [
  {
    name: 'core',
    weight: 4,
    required: true,
    tolerance: 0.18,
    texts: ['not invited to play', 'tidak diundang'],
  },
  { name: 'title', weight: 2, tolerance: 0.2, texts: ['unable to connect'] },
  { name: 'btn', weight: 1, texts: ['back to menu'] },
];

describe('evaluate', () => {
  it('fails when the required signal is missing even with a high score', () => {
    const r = evaluate(['Unable to connect', 'Back to Menu'], signals, 3);
    expect(r.score).toBe(3);
    expect(r.requiredOk).toBe(false);
    expect(r.matched).toBe(false);
  });

  it('fails when required is found but score is below minScore', () => {
    const r = evaluate(['you are not invited to play'], signals, 5);
    expect(r.requiredOk).toBe(true);
    expect(r.score).toBe(4);
    expect(r.matched).toBe(false);
  });

  it('matches when required + enough supporting signals', () => {
    const r = evaluate(['Not invited to play', 'Back to Menu'], signals, 5);
    expect(r.matched).toBe(true);
    expect(r.score).toBe(5);
  });

  it('accepts any text variant (Indonesian)', () => {
    const r = evaluate(['Kamu TIDAK diundang', 'unable to connect'], signals, 6);
    expect(r.matched).toBe(true);
  });

  it('combines text from several OCR passes', () => {
    const r = evaluate(['not invited to play', 'garbage', 'back to menu'], signals, 5);
    expect(r.matched).toBe(true);
  });

  it('tolerates OCR typos within tolerance', () => {
    const r = evaluate(['not lnvited to p1ay', 'unabIe to connect'], signals, 6);
    expect(r.matched).toBe(true);
  });

  it('reports per-signal detail', () => {
    const r = evaluate(['not invited to play'], signals, 5);
    expect(r.detail).toEqual([
      { name: 'core', found: true, weight: 4, required: true },
      { name: 'title', found: false, weight: 2, required: false },
      { name: 'btn', found: false, weight: 1, required: false },
    ]);
  });

  it('falls back to default tolerance when none is set', () => {
    // "back to menu" = 11 letters → floor(11 * 0.2) = 2 edits allowed
    expect(evaluate(['bock to manu'], signals, 0).detail[2]?.found).toBe(true);
    expect(evaluate(['bxxk to manu'], signals, 0).detail[2]?.found).toBe(false);
  });
});

describe('hasHint', () => {
  it('detects a trace of the core sentence', () => {
    expect(hasHint(["You're not invited"])).toBe(true);
    expect(hasHint(['tidak diundang untuk'])).toBe(true);
  });
  it('ignores unrelated text', () => {
    expect(hasHint(['Hello world, nothing here'])).toBe(false);
    expect(hasHint([])).toBe(false);
  });
});

describe('real signals config', () => {
  const { signals: real, minScore } = loadSignals();

  it('matches the English dialog', () => {
    const text = [
      'Unable to connect to world',
      "You're not invited to play on this server",
      'Back to Menu',
    ].join('\n');
    expect(evaluate([text], real, minScore).matched).toBe(true);
  });

  it('matches the Indonesian dialog', () => {
    const text = [
      'Tidak dapat terhubung ke dunia',
      'Kamu tidak diundang untuk bermain di server ini',
      'Kembali ke Menu',
    ].join('\n');
    expect(evaluate([text], real, minScore).matched).toBe(true);
  });

  it('does not match other connection errors (no false positive)', () => {
    const text = [
      'Unable to connect to world',
      'Outdated server!',
      'Back to Menu',
      'Show Details',
    ].join('\n');
    expect(evaluate([text], real, minScore).matched).toBe(false);
  });
});
