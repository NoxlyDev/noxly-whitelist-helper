import { MessageFlags } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { replyContent } from '../../src/discord/replies/content.js';
import { buildWhitelistReply } from '../../src/discord/replies/whitelist-reply.js';

describe('buildWhitelistReply', () => {
  it('uses Components V2 with a single container', () => {
    const r = buildWhitelistReply();
    expect(r.flags).toBe(MessageFlags.IsComponentsV2);
    expect(r.components).toHaveLength(1);
  });

  it('contains both solutions and the footer', () => {
    expect(replyContent.main).toContain('`whitelist off`');
    expect(replyContent.main).toContain('`whitelist add <username>`');
    expect(replyContent.other).toContain('Jangan lupa makan MBG');
  });

  it('serializes to valid JSON', () => {
    const json = JSON.parse(JSON.stringify(buildWhitelistReply().components[0]));
    expect(json.components.length).toBe(3); // text, separator, text
  });
});
