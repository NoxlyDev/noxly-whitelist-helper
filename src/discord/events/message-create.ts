import type { DetectionResult } from '../../core/detection/types.js';
import type { CooldownStore } from '../../services/cooldown/cooldown-store.js';
import type { ImageFetcher } from '../../services/image/image-fetcher.js';
import type { Logger } from '../../shared/logger.js';
import { getImageAttachments, shouldProcess, type MessageLike } from '../filters/message-filter.js';
import { buildWhitelistReply } from '../replies/whitelist-reply.js';

export interface MessageHandlerDeps {
  channelIds: readonly string[];
  minScore: number;
  cooldown: CooldownStore;
  fetchImage: ImageFetcher;
  analyze: (buffer: Buffer) => Promise<DetectionResult>;
  logger: Logger;
}

/** Thin orchestrator: filter → cooldown → fetch → analyze → reply. Never throws. */
export function createMessageHandler(deps: MessageHandlerDeps) {
  return async (message: MessageLike): Promise<void> => {
    if (!shouldProcess(message, { channelIds: deps.channelIds })) return;

    const images = getImageAttachments(message);
    if (!images.length) return;

    const userId = message.author.id;
    if (deps.cooldown.isCoolingDown(userId)) return;

    for (const image of images) {
      try {
        const buffer = await deps.fetchImage(image.url);
        const r = await deps.analyze(buffer);

        deps.logger.debug(
          {
            user: message.author.tag,
            userId,
            channelId: message.channelId,
            score: r.score,
            minScore: deps.minScore,
            matched: r.matched,
            stage: r.stage,
            durationMs: r.ms,
            signals: r.detail.map((d) => `${d.name}:${d.found ? '✔' : '✘'}`).join(' '),
          },
          'image analyzed',
        );
        if (!r.matched) continue;

        deps.cooldown.mark(userId);
        await message.reply({ ...buildWhitelistReply(), allowedMentions: { repliedUser: true } });
        deps.logger.info(
          { userId, channelId: message.channelId, score: r.score },
          'replied with whitelist fix',
        );
        return;
      } catch (err) {
        deps.logger.error({ err, userId, channelId: message.channelId }, 'failed to process image');
      }
    }
  };
}
