import type { Client } from 'discord.js';
import { BOT_ACTIVITY } from '../../shared/constants.js';
import type { Logger } from '../../shared/logger.js';

export function onReady(client: Client<true>, logger: Logger): void {
  logger.info({ tag: client.user.tag }, 'bot online');
  client.user.setActivity(BOT_ACTIVITY);
}
