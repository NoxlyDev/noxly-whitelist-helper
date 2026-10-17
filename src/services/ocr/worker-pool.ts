import Tesseract from 'tesseract.js';
import { OcrError } from '../../shared/errors.js';
import type { Logger } from '../../shared/logger.js';

type Worker = Tesseract.Worker;

export interface WorkerPoolOptions {
  psm: number;
  size: number;
  langPath: string;
  logger: Logger;
  /** Injectable for tests. */
  createWorker?: () => Promise<Worker>;
}

/** Fixed-size pool of pre-warmed Tesseract workers sharing one page-segmentation mode. */
export class WorkerPool {
  private readonly psm: string;
  private readonly size: number;
  private readonly langPath: string;
  private readonly logger: Logger;
  private readonly factory: () => Promise<Worker>;

  private readonly all: Worker[] = [];
  private readonly idle: Worker[] = [];
  private readonly waiting: Array<(w: Worker) => void> = [];
  private initPromise: Promise<void> | null = null;
  private closed = false;

  constructor(opts: WorkerPoolOptions) {
    this.psm = String(opts.psm);
    this.size = opts.size;
    this.langPath = opts.langPath;
    this.logger = opts.logger;
    this.factory = opts.createWorker ?? (() => this.spawnDefault());
  }

  private async spawnDefault(): Promise<Worker> {
    const worker = await Tesseract.createWorker('eng', 1, {
      langPath: this.langPath,
      gzip: false,
      cacheMethod: 'none',
    });
    await worker.setParameters({
      tessedit_pageseg_mode: this.psm as Tesseract.PSM,
      user_defined_dpi: '300',
    });
    return worker;
  }

  /** Idempotent; resolves once every worker is ready. */
  init(): Promise<void> {
    this.initPromise ??= (async () => {
      const workers = await Promise.all(Array.from({ length: this.size }, () => this.factory()));
      this.all.push(...workers);
      this.idle.push(...workers);
      this.logger.debug({ psm: this.psm, size: this.size }, 'OCR worker pool ready');
    })();
    return this.initPromise;
  }

  private async acquire(): Promise<Worker> {
    await this.init();
    if (this.closed) throw new OcrError('Worker pool is shut down');
    const w = this.idle.pop();
    if (w) return w;
    return new Promise<Worker>((resolve) => this.waiting.push(resolve));
  }

  private release(w: Worker): void {
    const next = this.waiting.shift();
    if (next) next(w);
    else this.idle.push(w);
  }

  async run(image: Buffer): Promise<string> {
    const w = await this.acquire();
    try {
      const {
        data: { text },
      } = await w.recognize(image);
      return text;
    } finally {
      this.release(w);
    }
  }

  async shutdown(): Promise<void> {
    this.closed = true;
    if (this.initPromise) await this.initPromise.catch(() => undefined);
    await Promise.allSettled(this.all.map((w) => w.terminate()));
    this.all.length = 0;
    this.idle.length = 0;
  }
}
