import { describe, expect, it } from 'vitest';
import { normalize } from '../../src/core/text/normalize.js';

describe('normalize', () => {
  it('lowercases and strips everything except a-z', () => {
    expect(normalize("You're NOT invited!")).toBe('youre' + 'notinvited');
  });
  it('removes digits, whitespace, newlines and symbols', () => {
    expect(normalize(' a1 b2\n c3\t-_. ')).toBe('abc');
  });
  it('drops non-ASCII letters', () => {
    expect(normalize('café ñ')).toBe('caf');
  });
  it('handles empty input', () => {
    expect(normalize('')).toBe('');
  });
});
