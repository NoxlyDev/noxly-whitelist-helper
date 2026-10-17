import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { join } from 'node:path';
import { ROOT_DIR } from './paths.js';

export interface EnvFileInfo {
  path: string;
  exists: boolean;
  /** Names only, never values. */
  keys: string[];
}

/** Decode a .env file regardless of how the editor/shell saved it (UTF-8, UTF-8 BOM, UTF-16 LE/BE). */
export function decodeEnvFile(raw: Buffer): string {
  let text: string;
  if (raw[0] === 0xff && raw[1] === 0xfe) text = raw.toString('utf16le');
  else if (raw[0] === 0xfe && raw[1] === 0xff)
    text = Buffer.from(raw.subarray(2)).swap16().toString('utf16le');
  else text = raw.toString('utf8');
  return text.replace(/^\uFEFF/, '');
}

/**
 * Load `.env` from the project folder (not the current working directory) into `target`.
 * Existing variables win, so real environment settings (Docker, systemd, CI) override the file.
 * Handles the Windows quirks: PowerShell `>` writes UTF-16, Notepad adds a BOM, CRLF line endings.
 */
export function loadEnvFile(
  path: string = join(ROOT_DIR, '.env'),
  target: NodeJS.ProcessEnv = process.env,
): EnvFileInfo {
  const info: EnvFileInfo = { path, exists: existsSync(path), keys: [] };
  if (!info.exists) return info;

  const text = decodeEnvFile(readFileSync(path)).replace(/\r\n?/g, '\n');
  const parsed = parseEnv(text) as Record<string, string | undefined>;
  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined) continue;
    info.keys.push(key);
    if (target[key] === undefined) target[key] = value;
  }
  return info;
}

/** Human-readable hint appended to config errors, so "why isn't my .env read?" is answerable at a glance. */
export function describeEnvFile(info: EnvFileInfo): string {
  return [
    `  .env searched at : ${info.path}`,
    `  file found       : ${info.exists ? 'yes' : 'NO (check the file name; it must not be ".env.txt")'}`,
    `  variables read   : ${info.keys.length ? info.keys.join(', ') : '(none)'}`,
  ].join('\n');
}
