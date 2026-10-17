import { Client, GatewayIntentBits } from 'discord.js';

export function createClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      // Must also be enabled in the Developer Portal, otherwise attachments are not readable.
      GatewayIntentBits.MessageContent,
    ],
  });
}
