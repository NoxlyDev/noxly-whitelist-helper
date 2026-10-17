export interface CooldownStore {
  isCoolingDown(key: string): boolean;
  mark(key: string): void;
  /** Number of tracked entries (mainly for tests / diagnostics). */
  size(): number;
}

/**
 * In-memory per-key cooldown with automatic expiry.
 * Expired entries are evicted lazily, so memory stays bounded without timers.
 */
export class InMemoryCooldownStore implements CooldownStore {
  private readonly entries = new Map<string, number>();
  private lastSweep = 0;

  constructor(
    private readonly cooldownMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  isCoolingDown(key: string): boolean {
    const at = this.entries.get(key);
    if (at === undefined) return false;
    if (this.now() - at >= this.cooldownMs) {
      this.entries.delete(key);
      return false;
    }
    return true;
  }

  mark(key: string): void {
    const t = this.now();
    this.entries.set(key, t);
    this.sweep(t);
  }

  size(): number {
    return this.entries.size;
  }

  private sweep(t: number): void {
    // At most one full sweep per cooldown window.
    if (t - this.lastSweep < Math.max(this.cooldownMs, 1_000)) return;
    this.lastSweep = t;
    for (const [key, at] of this.entries) {
      if (t - at >= this.cooldownMs) this.entries.delete(key);
    }
  }
}
