import type { EvaluationResult } from '../../core/detection/types.js';
import { OcrError } from '../../shared/errors.js';
import type { Logger } from '../../shared/logger.js';
import type { Recipe } from './recipes.js';

export interface StageDeps {
  /** Run OCR for the given page-segmentation mode on an already-preprocessed PNG buffer. */
  recognize: (psm: number, image: Buffer) => Promise<string>;
  evaluate: (texts: string[]) => EvaluationResult;
  concurrency: number;
  recipeTimeoutMs: number;
  logger: Logger;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new OcrError(`OCR recipe "${label}" timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Run recipes with bounded concurrency. Resolves as soon as one evaluation matches (early exit),
 * otherwise with the evaluation over all collected texts. A failing recipe is logged and skipped.
 */
export function runStage(
  recipes: Recipe[],
  buffer: Buffer,
  texts: string[],
  deps: StageDeps,
): Promise<EvaluationResult> {
  return new Promise((resolve) => {
    let next = 0;
    let active = 0;
    let done = false;

    const finish = (r: EvaluationResult) => {
      if (!done) {
        done = true;
        resolve(r);
      }
    };

    const runOne = async (recipe: Recipe) => {
      const exec = async () => {
        const image = await recipe.prepare(buffer).png().toBuffer();
        return deps.recognize(recipe.psm, image);
      };
      const text = await withTimeout(exec(), deps.recipeTimeoutMs, recipe.name);
      texts.push(text);
      const r = deps.evaluate(texts);
      if (r.matched) finish(r);
    };

    const pump = () => {
      if (done) return;
      while (active < deps.concurrency && next < recipes.length) {
        const recipe = recipes[next++]!;
        active++;
        runOne(recipe)
          .catch((err: unknown) => {
            deps.logger.warn({ err, recipe: recipe.name }, 'OCR recipe failed, skipping');
          })
          .finally(() => {
            active--;
            if (next >= recipes.length && active === 0) finish(deps.evaluate(texts));
            else pump();
          });
      }
    };

    if (recipes.length === 0) finish(deps.evaluate(texts));
    else pump();
  });
}
