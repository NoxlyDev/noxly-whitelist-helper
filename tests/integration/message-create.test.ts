import { describe, expect, it, vi } from 'vitest';
import type { DetectionResult } from '../../src/core/detection/types.js';
import {
  createMessageHandler,
  type MessageHandlerDeps,
} from '../../src/discord/events/message-create.js';
import { InMemoryCooldownStore } from '../../src/services/cooldown/cooldown-store.js';
import { createSilentLogger } from '../../src/shared/logger.js';
import { makeMessage } from '../helpers/message.js';

const result = (matched: boolean): DetectionResult => ({
  matched,
  score: matched ? 10 : 0,
  requiredOk: matched,
  detail: [{ name: 'core', found: matched, weight: 4, required: true }],
  text: '',
  stage: 1,
  ms: 5,
});

const setup = (over: Partial<MessageHandlerDeps> = {}) => {
  const deps: MessageHandlerDeps = {
    channelIds: [],
    minScore: 5,
    cooldown: new InMemoryCooldownStore(15_000),
    fetchImage: vi.fn(async () => Buffer.alloc(1)),
    analyze: vi.fn(async () => result(true)),
    logger: createSilentLogger(),
    ...over,
  };
  return { deps, handle: createMessageHandler(deps) };
};

const img = [{ url: 'https://cdn.discordapp.com/a.png', contentType: 'image/png' }];

describe('message handler', () => {
  it('replies when an image matches', async () => {
    const { handle, deps } = setup();
    const reply = vi.fn(async () => undefined);
    await handle(makeMessage({ files: img, reply }));
    expect(reply).toHaveBeenCalledOnce();
    const arg = (reply.mock.calls[0] as unknown[])[0] as {
      allowedMentions: unknown;
      components: unknown[];
    };
    expect(arg.allowedMentions).toEqual({ repliedUser: true });
    expect(arg.components).toHaveLength(1);
    expect(deps.cooldown.isCoolingDown('u1')).toBe(true);
  });

  it('ignores messages without images', async () => {
    const { handle, deps } = setup();
    const reply = vi.fn();
    await handle(makeMessage({ files: [], reply }));
    expect(deps.fetchImage).not.toHaveBeenCalled();
    expect(reply).not.toHaveBeenCalled();
  });

  it('ignores bots, DMs and unwatched channels', async () => {
    const { handle, deps } = setup({ channelIds: ['999'] });
    await handle(makeMessage({ files: img }));
    await handle(makeMessage({ files: img, author: { id: 'b', tag: 'b', bot: true } }));
    await handle(makeMessage({ files: img, guild: null }));
    expect(deps.fetchImage).not.toHaveBeenCalled();
  });

  it('does nothing while the user is cooling down', async () => {
    const { handle, deps } = setup();
    deps.cooldown.mark('u1');
    await handle(makeMessage({ files: img }));
    expect(deps.fetchImage).not.toHaveBeenCalled();
  });

  it('does not reply or start a cooldown when no image matches', async () => {
    const { handle, deps } = setup({ analyze: vi.fn(async () => result(false)) });
    const reply = vi.fn();
    await handle(makeMessage({ files: img, reply }));
    expect(reply).not.toHaveBeenCalled();
    expect(deps.cooldown.isCoolingDown('u1')).toBe(false);
  });

  it('tries the next image after a failure and then replies', async () => {
    const fetchImage = vi
      .fn()
      .mockRejectedValueOnce(new Error('download failed'))
      .mockResolvedValue(Buffer.alloc(1));
    const { handle } = setup({ fetchImage });
    const reply = vi.fn(async () => undefined);
    await handle(
      makeMessage({ files: [...img, { url: 'https://cdn.discordapp.com/b.png' }], reply }),
    );
    expect(fetchImage).toHaveBeenCalledTimes(2);
    expect(reply).toHaveBeenCalledOnce();
  });

  it('replies at most once per message', async () => {
    const { handle, deps } = setup();
    const reply = vi.fn(async () => undefined);
    await handle(makeMessage({ files: [...img, ...img, ...img], reply }));
    expect(reply).toHaveBeenCalledOnce();
    expect(deps.fetchImage).toHaveBeenCalledOnce();
  });

  it('never throws when replying fails (e.g. missing permissions)', async () => {
    const { handle } = setup();
    const reply = vi.fn(async () => {
      throw new Error('Missing Permissions');
    });
    await expect(handle(makeMessage({ files: img, reply }))).resolves.toBeUndefined();
  });
});
