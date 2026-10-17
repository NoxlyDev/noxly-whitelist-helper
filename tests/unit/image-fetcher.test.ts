import { describe, expect, it, vi } from 'vitest';
import { createImageFetcher, isSupportedImage } from '../../src/services/image/image-fetcher.js';
import { ImageFetchError } from '../../src/shared/errors.js';

const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(32),
]);
const URL_OK = 'https://cdn.discordapp.com/attachments/1/2/a.png';
const hosts = ['cdn.discordapp.com'] as const;

const respond = (body: Buffer | null, init: ResponseInit = {}) =>
  vi.fn(async () => new Response(body, { status: 200, ...init }));

const make = (fetchImpl: typeof fetch, maxBytes = 1024) =>
  createImageFetcher({ timeoutMs: 1000, maxBytes, allowedHosts: hosts, fetchImpl });

describe('isSupportedImage', () => {
  it('recognizes png, jpeg, gif and webp', () => {
    expect(isSupportedImage(PNG)).toBe(true);
    expect(
      isSupportedImage(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(16)])),
    ).toBe(true);
    expect(isSupportedImage(Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(16)]))).toBe(true);
    expect(
      isSupportedImage(
        Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP'), Buffer.alloc(8)]),
      ),
    ).toBe(true);
  });
  it('rejects other data and tiny buffers', () => {
    expect(isSupportedImage(Buffer.from('<html>not an image at all</html>'))).toBe(false);
    expect(isSupportedImage(Buffer.alloc(4))).toBe(false);
  });
});

describe('createImageFetcher', () => {
  it('downloads a valid image', async () => {
    const buf = await make(respond(PNG))(URL_OK);
    expect(buf.equals(PNG)).toBe(true);
  });

  it('rejects invalid URLs', async () => {
    await expect(make(respond(PNG))('not a url')).rejects.toThrow(ImageFetchError);
  });

  it('rejects hosts outside the allowlist without fetching', async () => {
    const f = respond(PNG);
    await expect(make(f)('https://evil.example.com/a.png')).rejects.toThrow(/not allowed/);
    expect(f).not.toHaveBeenCalled();
  });

  it('rejects non-https URLs', async () => {
    await expect(make(respond(PNG))('http://cdn.discordapp.com/a.png')).rejects.toThrow(
      /not allowed/,
    );
  });

  it('rejects non-2xx responses', async () => {
    await expect(make(respond(null, { status: 404 }))(URL_OK)).rejects.toThrow(/HTTP 404/);
  });

  it('rejects when content-length exceeds the cap', async () => {
    const f = respond(PNG, { headers: { 'content-length': '999999' } });
    await expect(make(f)(URL_OK)).rejects.toThrow(/too large/);
  });

  it('enforces the cap while streaming when content-length is missing', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5000)]);
    await expect(make(respond(big), 1024)(URL_OK)).rejects.toThrow(/too large/);
  });

  it('rejects data that is not an image', async () => {
    const html = Buffer.from('<html>definitely not an image, sorry</html>');
    await expect(make(respond(html))(URL_OK)).rejects.toThrow(/Unsupported/);
  });

  it('wraps network errors', async () => {
    const f = vi.fn(async () => {
      throw new Error('boom');
    });
    await expect(make(f as unknown as typeof fetch)(URL_OK)).rejects.toThrow(/boom/);
  });

  it('rejects an empty body', async () => {
    await expect(make(respond(null))(URL_OK)).rejects.toThrow(ImageFetchError);
  });
});
