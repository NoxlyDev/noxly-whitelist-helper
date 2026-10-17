import os from 'node:os';
import { evaluate } from '../../core/detection/evaluate.js';
import { hasHint } from '../../core/detection/hint.js';
import type { DetectionResult, Signal } from '../../core/detection/types.js';
import type { Logger } from '../../shared/logger.js';
import { STAGE1, STAGE2 } from './recipes.js';
import { runStage } from './stage-runner.js';
import { WorkerPool } from './worker-pool.js';

export interface OcrServiceOptions {
  signals: Signal[];
  minScore: number;
  langPath: string;
  logger: Logger;
  /** Max parallel OCR recipes. Defaults to min(3, cpu count). */
  concurrency?: number;
  recipeTimeoutMs: number;
}

export interface AnalyzeOptions {
  stage1Only?: boolean;
}

export interface OcrService {
  analyze(buffer: Buffer, opts?: AnalyzeOptions): Promise<DetectionResult>;
  warmup(): Promise<void>;
  shutdown(): Promise<void>;
}

/**
 * Two-stage OCR detection pipeline:
 *  - Stage 1: 3 recipes in parallel, early exit on match
 *  - Stage 2: harder recipes, only if stage 1 found a hint of the core sentence
 */
export function createOcrService(opts: OcrServiceOptions): OcrService {
  const cpus = os.cpus().length;
  const poolSize = Math.max(2, Math.min(4, cpus));
  const concurrency = opts.concurrency ?? Math.max(1, Math.min(3, cpus));

  const pools: Record<number, WorkerPool> = {
    11: new WorkerPool({ psm: 11, size: poolSize, langPath: opts.langPath, logger: opts.logger }),
    6: new WorkerPool({
      psm: 6,
      size: Math.max(1, poolSize - 1),
      langPath: opts.langPath,
      logger: opts.logger,
    }),
  };

  const stageDeps = {
    recognize: (psm: number, image: Buffer) => {
      const pool = pools[psm];
      if (!pool) throw new Error(`No OCR pool for PSM ${psm}`);
      return pool.run(image);
    },
    evaluate: (texts: string[]) => evaluate(texts, opts.signals, opts.minScore),
    concurrency,
    recipeTimeoutMs: opts.recipeTimeoutMs,
    logger: opts.logger,
  };

  return {
    async analyze(buffer, { stage1Only = false } = {}) {
      const t0 = Date.now();
      const texts: string[] = [];
      let result = await runStage(STAGE1, buffer, texts, stageDeps);
      let stage: 1 | 2 = 1;
      if (!result.matched && !stage1Only && hasHint(texts)) {
        result = await runStage(STAGE2, buffer, texts, stageDeps);
        stage = 2;
      }
      return { ...result, stage, ms: Date.now() - t0 };
    },

    async warmup() {
      await Promise.all(Object.values(pools).map((p) => p.init()));
    },

    async shutdown() {
      await Promise.all(Object.values(pools).map((p) => p.shutdown()));
    },
  };
}
