import { fuzzyIncludes } from '../text/fuzzy.js';
import { normalize } from '../text/normalize.js';

const HINT_PATTERNS = [
  'notinvited',
  'invitedtoplay',
  'playonthisserver',
  'tidakdiundang',
  'bermaindiserver',
] as const;

/**
 * Is there any trace of the core sentence? Gates the expensive stage 2 so that
 * unrelated screenshots never pay for it.
 */
export function hasHint(texts: string[]): boolean {
  const n = normalize(texts.join('\n'));
  return HINT_PATTERNS.some((p) => fuzzyIncludes(n, p, Math.floor(p.length * 0.3)));
}
