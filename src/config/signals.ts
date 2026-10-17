import { readFileSync } from 'node:fs';
import { z } from 'zod';
import type { Signal } from '../core/detection/types.js';
import { ConfigError } from '../shared/errors.js';
import { SIGNALS_FILE } from './paths.js';

const signalSchema = z.object({
  name: z.string().min(1),
  weight: z.number().positive(),
  required: z.boolean().optional(),
  tolerance: z.number().min(0).max(1).optional(),
  texts: z.array(z.string().min(1)).min(1),
});

const signalsFileSchema = z
  .object({
    minScore: z.number().positive(),
    signals: z.array(signalSchema).min(1),
  })
  .superRefine((cfg, ctx) => {
    const names = new Set<string>();
    for (const s of cfg.signals) {
      if (names.has(s.name)) {
        ctx.addIssue({ code: 'custom', message: `duplicate signal name "${s.name}"` });
      }
      names.add(s.name);
    }
    const max = cfg.signals.reduce((sum, s) => sum + s.weight, 0);
    if (cfg.minScore > max) {
      ctx.addIssue({
        code: 'custom',
        message: `minScore (${cfg.minScore}) exceeds total weight (${max})`,
      });
    }
  });

export interface SignalsConfig {
  minScore: number;
  signals: Signal[];
}

export function parseSignals(raw: unknown): SignalsConfig {
  const result = signalsFileSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map(
      (i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`,
    );
    throw new ConfigError(`Invalid signals config:\n${lines.join('\n')}`);
  }
  return result.data as SignalsConfig;
}

export function loadSignals(file: string = SIGNALS_FILE): SignalsConfig {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, 'utf8'));
  } catch (cause) {
    throw new ConfigError(`Cannot read signals config at ${file}`, { cause });
  }
  return parseSignals(raw);
}
