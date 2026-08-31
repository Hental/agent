export class TaskQueue {
  private activeCount = 0;
  private readonly idleResolvers = new Set<() => void>();
  private readonly pending: Array<{
    task: () => Promise<unknown>;
    resolve: () => void;
    reject: (error: unknown) => void;
  }> = [];

  constructor(readonly concurrency = 1) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
      throw new Error('concurrency 必须是正整数');
    }
  }

  add(task: () => Promise<unknown>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pending.push({ task, resolve, reject });
      this.drain();
    });
  }

  get size(): number {
    return this.pending.length;
  }

  get active(): number {
    return this.activeCount;
  }

  onIdle(): Promise<void> {
    if (this.activeCount === 0 && this.pending.length === 0) return Promise.resolve();
    return new Promise((resolve) => this.idleResolvers.add(resolve));
  }

  private drain(): void {
    while (this.activeCount < this.concurrency && this.pending.length > 0) {
      const item = this.pending.shift();
      if (!item) return;
      this.activeCount += 1;
      Promise.resolve()
        .then(item.task)
        .then(() => item.resolve(), item.reject)
        .finally(() => {
          this.activeCount -= 1;
          this.drain();
          if (this.activeCount === 0 && this.pending.length === 0) {
            for (const resolve of this.idleResolvers) resolve();
            this.idleResolvers.clear();
          }
        });
    }
  }
}
