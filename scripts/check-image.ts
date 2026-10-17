// Usage: npm run check:image -- path/to/image.png [more.png ...]
import { readFileSync } from 'node:fs';
import { TESSDATA_DIR } from '../src/config/paths.js';
import { loadSignals } from '../src/config/signals.js';
import { createOcrService } from '../src/services/ocr/ocr-service.js';
import { createLogger } from '../src/shared/logger.js';

const files = process.argv.slice(2);
if (!files.length) {
  console.log('Usage: npm run check:image -- <image> [image...]');
  process.exit(1);
}

const { signals, minScore } = loadSignals();
const logger = createLogger({ level: process.env.LOG_LEVEL ?? 'warn' });
const ocr = createOcrService({
  signals,
  minScore,
  langPath: TESSDATA_DIR,
  logger,
  recipeTimeoutMs: 30_000,
});

let exitCode = 0;
try {
  await ocr.warmup();
  for (const file of files) {
    const r = await ocr.analyze(readFileSync(file));
    console.log(
      `${file}\n  MATCH=${r.matched}  score=${r.score}/${minScore}  core=${r.requiredOk}  stage=${r.stage}  ${r.ms}ms`,
    );
    console.log('  ' + r.detail.map((d) => `${d.name}:${d.found ? '✔' : '✘'}`).join('  '));
  }
} catch (err) {
  console.error(err);
  exitCode = 1;
} finally {
  await ocr.shutdown();
}
process.exit(exitCode);
