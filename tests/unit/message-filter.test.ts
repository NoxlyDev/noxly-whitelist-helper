import { describe, expect, it } from 'vitest';
import {
  getImageAttachments,
  isImageAttachment,
  shouldProcess,
} from '../../src/discord/filters/message-filter.js';
import { makeMessage } from '../helpers/message.js';

describe('shouldProcess', () => {
  it('ignores bots', () => {
    const m = makeMessage({ author: { id: 'b', tag: 'b', bot: true } });
    expect(shouldProcess(m, { channelIds: [] })).toBe(false);
  });
  it('ignores DMs (no guild)', () => {
    expect(shouldProcess(makeMessage({ guild: null }), { channelIds: [] })).toBe(false);
  });
  it('watches all channels when the list is empty', () => {
    expect(shouldProcess(makeMessage(), { channelIds: [] })).toBe(true);
  });
  it('restricts to configured channels', () => {
    expect(shouldProcess(makeMessage(), { channelIds: ['111'] })).toBe(true);
    expect(shouldProcess(makeMessage(), { channelIds: ['222'] })).toBe(false);
  });
});

describe('isImageAttachment', () => {
  it('accepts by content type', () => {
    expect(isImageAttachment({ url: 'https://x/y', contentType: 'image/png' })).toBe(true);
  });
  it('accepts by extension, including query strings', () => {
    expect(isImageAttachment({ url: 'https://x/a.JPG?ex=1' })).toBe(true);
    expect(isImageAttachment({ url: 'https://x/a.webp' })).toBe(true);
  });
  it('rejects non-images', () => {
    expect(isImageAttachment({ url: 'https://x/a.txt', contentType: 'text/plain' })).toBe(false);
  });
});

describe('getImageAttachments', () => {
  it('keeps only images and caps at 3', () => {
    const files = [
      { url: 'https://x/1.png' },
      { url: 'https://x/2.txt' },
      { url: 'https://x/3.png' },
      { url: 'https://x/4.png' },
      { url: 'https://x/5.png' },
    ];
    const got = getImageAttachments(makeMessage({ files }));
    expect(got.map((a) => a.url)).toEqual([
      'https://x/1.png',
      'https://x/3.png',
      'https://x/4.png',
    ]);
  });
});
