import type { AttachmentLike, MessageLike } from '../../src/discord/filters/message-filter.js';

export const makeMessage = (
  over: Partial<MessageLike> & { files?: AttachmentLike[] } = {},
): MessageLike => {
  const { files = [], ...rest } = over;
  return {
    author: { id: 'u1', tag: 'user#0001', bot: false },
    guild: {},
    channelId: '111',
    attachments: { values: () => files[Symbol.iterator]() as IterableIterator<AttachmentLike> },
    reply: async () => undefined,
    ...rest,
  };
};
