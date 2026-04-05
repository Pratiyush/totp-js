/**
 * Replay attack prevention for TOTP codes.
 */

export interface ReplayGuard {
  markUsed(key: string): boolean;
  wasUsed(key: string): boolean;
  clear(): void;
  size(): number;
}

export class InMemoryReplayGuard implements ReplayGuard {
  private readonly usedCodes = new Map<string, number>();
  private readonly retentionMs: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(retentionMs: number = 120_000) {
    this.retentionMs = retentionMs;
    const cleanupInterval = Math.max(retentionMs / 2, 1000);
    this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);
    // Allow process to exit even if timer is active
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  static withDefaultRetention(): InMemoryReplayGuard {
    return new InMemoryReplayGuard(120_000); // 2 minutes
  }

  static forConfig(config: { period: number; allowedDrift: number }): InMemoryReplayGuard {
    const retentionMs = config.period * (2 * config.allowedDrift + 1) * 1000;
    return new InMemoryReplayGuard(retentionMs);
  }

  markUsed(key: string): boolean {
    if (this.usedCodes.has(key)) return false;
    this.usedCodes.set(key, Date.now());
    return true;
  }

  wasUsed(key: string): boolean {
    return this.usedCodes.has(key);
  }

  clear(): void {
    this.usedCodes.clear();
  }

  size(): number {
    return this.usedCodes.size;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.usedCodes.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamp] of this.usedCodes) {
      if (now - timestamp > this.retentionMs) {
        this.usedCodes.delete(key);
      }
    }
  }
}
