import { fuzzyIncludes } from '../text/fuzzy.js';
import { normalize } from '../text/normalize.js';
import type { EvaluationResult, Signal } from './types.js';

const DEFAULT_TOLERANCE = 0.2;

/** Score OCR output against the configured signals. Matches when all required signals are found and score >= minScore. */
export function evaluate(texts: string[], signals: Signal[], minScore: number): EvaluationResult {
  const joined = texts.join('\n');
  const norm = normalize(joined);
  let score = 0;
  let requiredOk = true;

  const detail = signals.map((s) => {
    const found = s.texts.some((variant) => {
      const p = normalize(variant);
      return fuzzyIncludes(norm, p, Math.floor(p.length * (s.tolerance ?? DEFAULT_TOLERANCE)));
    });
    if (found) score += s.weight;
    if (s.required && !found) requiredOk = false;
    return { name: s.name, found, weight: s.weight, required: !!s.required };
  });

  return { matched: requiredOk && score >= minScore, score, requiredOk, detail, text: joined };
}
