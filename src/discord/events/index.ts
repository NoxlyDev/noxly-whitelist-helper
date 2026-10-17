import { Events, type Client, type Message } from 'discord.js';
import type { Logger } from '../../shared/logger.js';
import type { MessageLike } from '../filters/message-filter.js';
import { onReady } from './ready.js';

export function registerEvents(
  client: Client,
  handleMessage: (message: MessageLike) => Promise<void>,
  logger: Logger,
): void {
  client.once(Events.ClientReady, (c) => onReady(c, logger));
  client.on(Events.MessageCreate, (message: Message) => {
    void handleMessage(message as unknown as MessageLike);
  });
  client.on(Events.Error, (err) => logger.error({ err }, 'discord client error'));
  client.on(Events.Warn, (msg) => logger.warn(msg));
}
