/**
 * Save mutex / queue to serialize async save operations.
 * Ensures only one save runs at a time; queued saves collapse into one.
 */
export class SaveMutex {
  private running = false;
  private pending: (() => Promise<void>) | null = null;

  async run(fn: () => Promise<void>): Promise<void> {
    if (this.running) {
      // Collapse: only keep the latest pending save
      this.pending = fn;
      return;
    }

    this.running = true;
    try {
      await fn();
    } catch (e) {
      console.error('[SaveMutex] Save failed:', e);
    }

    // Process pending save (latest wins)
    while (this.pending) {
      const next = this.pending;
      this.pending = null;
      try {
        await next();
      } catch (e) {
        console.error('[SaveMutex] Queued save failed:', e);
      }
    }

    this.running = false;
  }

  get isRunning() {
    return this.running;
  }
}
