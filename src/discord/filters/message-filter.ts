import { MAX_IMAGES_PER_MESSAGE } from '../../shared/constants.js';

const IMAGE_EXT = /\.(png|jpe?g|webp)(\?|$)/i;

export interface AttachmentLike {
  url: string;
  contentType?: string | null;
}

/** The subset of discord.js `Message` this bot needs; keeps handlers easy to test. */
export interface MessageLike {
  author: { id: string; tag: string; bot: boolean };
  guild: unknown;
  channelId: string;
  attachments: { values(): IterableIterator<AttachmentLike> };
  reply(options: unknown): Promise<unknown>;
}

export interface FilterOptions {
  /** Empty = watch every channel. */
  channelIds: readonly string[];
}

export function isImageAttachment(a: AttachmentLike): boolean {
  return !!(a.contentType && a.contentType.startsWith('image/')) || IMAGE_EXT.test(a.url);
}

/** Cheap pre-checks: not a bot, in a guild, in a watched channel. */
export function shouldProcess(message: MessageLike, opts: FilterOptions): boolean {
  if (message.author.bot || !message.guild) return false;
  if (opts.channelIds.length && !opts.channelIds.includes(message.channelId)) return false;
  return true;
}

/** Image attachments to scan, capped per message. */
export function getImageAttachments(message: MessageLike): AttachmentLike[] {
  return [...message.attachments.values()]
    .filter(isImageAttachment)
    .slice(0, MAX_IMAGES_PER_MESSAGE);
}
