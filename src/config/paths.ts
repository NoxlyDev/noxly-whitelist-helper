import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Works from both src/config (tsx) and dist/config (compiled): two levels up = project root.
const here = dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = resolve(here, '../..');
export const TESSDATA_DIR = resolve(ROOT_DIR, 'assets/tessdata');
export const SIGNALS_FILE = resolve(ROOT_DIR, 'config/signals.json');
