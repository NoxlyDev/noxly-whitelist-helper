import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { decodeEnvFile, describeEnvFile, loadEnvFile } from '../../src/config/load-env.js';

const dir = mkdtempSync(join(tmpdir(), 'noxly-env-'));
const write = (name: string, data: Buffer | string) => {
  const p = join(dir, name);
  writeFileSync(p, data);
  return p;
};
const CONTENT =
  'DISCORD_TOKEN=abc.def\r\nCOOLDOWN_SECONDS=20\r\n# comment\r\nLOG_LEVEL="debug"\r\n';

describe('loadEnvFile', () => {
  it('reports a missing file without throwing', () => {
    const info = loadEnvFile(join(dir, 'nope.env'), {});
    expect(info.exists).toBe(false);
    expect(describeEnvFile(info)).toContain('NO');
  });

  it('reads plain UTF-8 with CRLF line endings and quotes', () => {
    const target: NodeJS.ProcessEnv = {};
    const info = loadEnvFile(write('utf8.env', CONTENT), target);
    expect(target).toMatchObject({
      DISCORD_TOKEN: 'abc.def',
      COOLDOWN_SECONDS: '20',
      LOG_LEVEL: 'debug',
    });
    expect([...info.keys].sort()).toEqual(['COOLDOWN_SECONDS', 'DISCORD_TOKEN', 'LOG_LEVEL']);
  });

  it('reads UTF-8 with BOM (Notepad)', () => {
    const target: NodeJS.ProcessEnv = {};
    loadEnvFile(
      write('bom.env', Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(CONTENT)])),
      target,
    );
    expect(target.DISCORD_TOKEN).toBe('abc.def');
  });

  it('reads UTF-16 LE (PowerShell `>` redirection)', () => {
    const target: NodeJS.ProcessEnv = {};
    const raw = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(CONTENT, 'utf16le')]);
    loadEnvFile(write('utf16le.env', raw), target);
    expect(target.DISCORD_TOKEN).toBe('abc.def');
  });

  it('reads UTF-16 BE', () => {
    const le = Buffer.from(CONTENT, 'utf16le');
    const be = Buffer.from(le).swap16();
    const target: NodeJS.ProcessEnv = {};
    loadEnvFile(write('utf16be.env', Buffer.concat([Buffer.from([0xfe, 0xff]), be])), target);
    expect(target.DISCORD_TOKEN).toBe('abc.def');
  });

  it('does not override variables that are already set', () => {
    const target: NodeJS.ProcessEnv = { DISCORD_TOKEN: 'from-real-env' };
    loadEnvFile(write('keep.env', CONTENT), target);
    expect(target.DISCORD_TOKEN).toBe('from-real-env');
    expect(target.COOLDOWN_SECONDS).toBe('20');
  });

  it('describes what was read, names only', () => {
    const info = loadEnvFile(write('desc.env', CONTENT), {});
    const text = describeEnvFile(info);
    expect(text).toContain('DISCORD_TOKEN');
    expect(text).not.toContain('abc.def');
  });
});

describe('decodeEnvFile', () => {
  it('strips a leading BOM character', () => {
    expect(decodeEnvFile(Buffer.from('\uFEFFA=1'))).toBe('A=1');
  });
});
