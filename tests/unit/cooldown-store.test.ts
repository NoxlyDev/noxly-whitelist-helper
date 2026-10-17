import { describe, expect, it } from 'vitest';
import { InMemoryCooldownStore } from '../../src/services/cooldown/cooldown-store.js';

describe('InMemoryCooldownStore', () => {
  it('is not cooling down before being marked', () => {
    expect(new InMemoryCooldownStore(1000).isCoolingDown('u1')).toBe(false);
  });

  it('cools down until the window elapses', () => {
    let t = 0;
    const store = new InMemoryCooldownStore(1000, () => t);
    store.mark('u1');
    t = 999;
    expect(store.isCoolingDown('u1')).toBe(true);
    t = 1000;
    expect(store.isCoolingDown('u1')).toBe(false);
  });

  it('tracks users independently', () => {
    const store = new InMemoryCooldownStore(1000, () => 0);
    store.mark('u1');
    expect(store.isCoolingDown('u2')).toBe(false);
  });

  it('evicts expired entries so memory stays bounded', () => {
    let t = 0;
    const store = new InMemoryCooldownStore(1000, () => t);
    for (let i = 0; i < 100; i++) store.mark(`u${i}`);
    expect(store.size()).toBe(100);
    t = 5000;
    store.mark('fresh');
    expect(store.size()).toBe(1);
  });

  it('a zero cooldown never blocks', () => {
    const store = new InMemoryCooldownStore(0, () => 0);
    store.mark('u1');
    expect(store.isCoolingDown('u1')).toBe(false);
  });
});
