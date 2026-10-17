/**
 * Approximate substring match (Sellers algorithm).
 * True when `pattern` appears somewhere in `text` with at most `maxDist` edits.
 * An empty pattern trivially matches.
 */
export function fuzzyIncludes(text: string, pattern: string, maxDist: number): boolean {
  const m = pattern.length;
  if (m === 0) return true;

  let prev = Array.from({ length: m + 1 }, (_, i) => i);
  for (let j = 0; j < text.length; j++) {
    const cur: number[] = [0];
    for (let i = 1; i <= m; i++) {
      const cost = pattern[i - 1] === text[j] ? 0 : 1;
      cur[i] = Math.min(prev[i]! + 1, cur[i - 1]! + 1, prev[i - 1]! + cost);
    }
    if (cur[m]! <= maxDist) return true;
    prev = cur;
  }
  return false;
}
