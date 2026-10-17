import { describe, expect, it } from 'vitest';
import { fuzzyIncludes } from '../../src/core/text/fuzzy.js';

describe('fuzzyIncludes', () => {
  it('finds an exact substring with maxDist 0', () => {
    expect(fuzzyIncludes('xxhelloxx', 'hello', 0)).toBe(true);
  });
  it('rejects a missing pattern with maxDist 0', () => {
    expect(fuzzyIncludes('xxhelxoxx', 'hello', 0)).toBe(false);
  });
  it('tolerates one substitution', () => {
    expect(fuzzyIncludes('xxhelxoxx', 'hello', 1)).toBe(true);
  });
  it('tolerates one insertion and one deletion', () => {
    expect(fuzzyIncludes('xxhelllozz', 'hello', 1)).toBe(true);
    expect(fuzzyIncludes('xxhelozz', 'hello', 1)).toBe(true);
  });
  it('respects the edit budget boundary', () => {
    expect(fuzzyIncludes('abcdef', 'axcxef', 1)).toBe(false);
    expect(fuzzyIncludes('abcdef', 'axcxef', 2)).toBe(true);
  });
  it('returns false on empty text', () => {
    expect(fuzzyIncludes('', 'hello', 1)).toBe(false);
  });
  it('treats an empty pattern as a trivial match', () => {
    expect(fuzzyIncludes('abc', '', 0)).toBe(true);
    expect(fuzzyIncludes('', '', 0)).toBe(true);
  });
  it('matches at the very start and end of the text', () => {
    expect(fuzzyIncludes('helloabc', 'hello', 0)).toBe(true);
    expect(fuzzyIncludes('abchello', 'hello', 0)).toBe(true);
  });
});
