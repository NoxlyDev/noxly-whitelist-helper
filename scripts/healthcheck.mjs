// Docker HEALTHCHECK: exits 0 if the bot wrote a heartbeat recently (i.e. it is connected to Discord).
import { statSync } from 'node:fs';
import process from 'node:process';

const file = process.env.HEALTH_FILE || '/tmp/noxly-healthy';
const maxAgeMs = 90_000;

try {
  process.exit(Date.now() - statSync(file).mtimeMs <= maxAgeMs ? 0 : 1);
} catch {
  process.exit(1);
}
