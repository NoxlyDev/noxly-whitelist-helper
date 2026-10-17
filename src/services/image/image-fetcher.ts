import { ImageFetchError } from '../../shared/errors.js';

export interface ImageFetcherOptions {
  timeoutMs: number;
  maxBytes: number;
  /** If set, only these hostnames (https) are allowed. */
  allowedHosts?: readonly string[];
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

export type ImageFetcher = (url: string) => Promise<Buffer>;

/** Detect png / jpeg / webp / gif by magic bytes (don't trust Content-Type). */
export function isSupportedImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  const png = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const gif = buf.subarray(0, 3).toString('ascii') === 'GIF';
  const webp =
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP';
  return png || jpeg || gif || webp;
}

export function createImageFetcher(opts: ImageFetcherOptions): ImageFetcher {
  const doFetch = opts.fetchImpl ?? fetch;

  return async (rawUrl) => {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch (cause) {
      throw new ImageFetchError('Invalid image URL', { cause });
    }
    if (opts.allowedHosts) {
      if (url.protocol !== 'https:' || !opts.allowedHosts.includes(url.hostname)) {
        throw new ImageFetchError(`Image host not allowed: ${url.hostname}`);
      }
    }

    let res: Response;
    try {
      res = await doFetch(url, { signal: AbortSignal.timeout(opts.timeoutMs) });
    } catch (cause) {
      throw new ImageFetchError(`Image download failed: ${(cause as Error).message}`, { cause });
    }
    if (!res.ok) throw new ImageFetchError(`Image download failed with HTTP ${res.status}`);

    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > opts.maxBytes) {
      await res.body?.cancel();
      throw new ImageFetchError(`Image too large (${declared} > ${opts.maxBytes} bytes)`);
    }

    // Stream with a hard cap: content-length can be missing or lie.
    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
      if (!res.body) throw new ImageFetchError('Empty response body');
      for await (const chunk of res.body as unknown as AsyncIterable<Uint8Array>) {
        total += chunk.byteLength;
        if (total > opts.maxBytes) {
          throw new ImageFetchError(`Image too large (> ${opts.maxBytes} bytes)`);
        }
        chunks.push(chunk);
      }
    } catch (cause) {
      if (cause instanceof ImageFetchError) throw cause;
      throw new ImageFetchError(`Image download failed: ${(cause as Error).message}`, { cause });
    }

    const buffer = Buffer.concat(chunks);
    if (!isSupportedImage(buffer)) throw new ImageFetchError('Unsupported or corrupt image data');
    return buffer;
  };
}
