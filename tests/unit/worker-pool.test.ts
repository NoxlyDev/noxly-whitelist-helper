import type Tesseract from 'tesseract.js';
import { describe, expect, it, vi } from 'vitest';
import { WorkerPool } from '../../src/services/ocr/worker-pool.js';
import { createSilentLogger } from '../../src/shared/logger.js';

const fakeWorker = (delay = 0, text = 'ok') =>
  ({
    recognize: vi.fn(async () => {
      await new Promise((r) => setTimeout(r, delay));
      return { data: { text } };
    }),
    terminate: vi.fn(async () => undefined),
  }) as unknown as Tesseract.Worker;

const pool = (size: number, workers: Tesseract.Worker[]) => {
  let i = 0;
  return new WorkerPool({
    psm: 11,
    size,
    langPath: '/tmp',
    logger: createSilentLogger(),
    createWorker: async () => workers[i++]!,
  });
};

describe('WorkerPool', () => {
  it('runs recognition through a worker', async () => {
    const p = pool(1, [fakeWorker(0, 'hello')]);
    expect(await p.run(Buffer.alloc(1))).toBe('hello');
    await p.shutdown();
  });

  it('queues work when all workers are busy and reuses workers', async () => {
    const w = fakeWorker(10);
    const p = pool(1, [w]);
    const results = await Promise.all([
      p.run(Buffer.alloc(1)),
      p.run(Buffer.alloc(1)),
      p.run(Buffer.alloc(1)),
    ]);
    expect(results).toHaveLength(3);
    expect(w.recognize).toHaveBeenCalledTimes(3);
    await p.shutdown();
  });

  it('init is idempotent', async () => {
    const create = vi.fn(async () => fakeWorker());
    const p = new WorkerPool({
      psm: 6,
      size: 2,
      langPath: '/tmp',
      logger: createSilentLogger(),
      createWorker: create,
    });
    await Promise.all([p.init(), p.init()]);
    await p.init();
    expect(create).toHaveBeenCalledTimes(2);
    await p.shutdown();
  });

  it('releases the worker even if recognition throws', async () => {
    const w = fakeWorker();
    (w.recognize as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('bad'));
    const p = pool(1, [w]);
    await expect(p.run(Buffer.alloc(1))).rejects.toThrow('bad');
    await expect(p.run(Buffer.alloc(1))).resolves.toBe('ok');
    await p.shutdown();
  });

  it('terminates every worker on shutdown and refuses new work', async () => {
    const ws = [fakeWorker(), fakeWorker()];
    const p = pool(2, ws);
    await p.init();
    await p.shutdown();
    ws.forEach((w) => expect(w.terminate).toHaveBeenCalledOnce());
    await expect(p.run(Buffer.alloc(1))).rejects.toThrow(/shut down/);
  });

  it('shutdown before init is safe', async () => {
    await expect(pool(1, [fakeWorker()]).shutdown()).resolves.toBeUndefined();
  });
});
