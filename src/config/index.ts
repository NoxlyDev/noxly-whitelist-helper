import { parseEnv, type Env } from './env.js';
import { loadSignals, type SignalsConfig } from './signals.js';

export interface AppConfig {
  env: Env;
  detection: SignalsConfig;
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  return { env: parseEnv(source), detection: loadSignals() };
}

export type { Env, SignalsConfig };
export { loadSignals };
