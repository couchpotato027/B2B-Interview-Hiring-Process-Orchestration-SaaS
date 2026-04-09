import { logger } from '../logging/logger';

export class RateLimiter {
  private lastCallTime: number = 0;
  private readonly minIntervalMs: number;
  private queue: Array<() => void> = [];
  private isProcessing: boolean = false;

  constructor(callsPerMinute: number = 12) {
    // Leave some buffer (15 is the hard limit for Gemini free tier, we use 12 by default)
    this.minIntervalMs = 60000 / callsPerMinute;
  }

  public async acquire(): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastCall = now - this.lastCallTime;
      const waitTime = Math.max(0, this.minIntervalMs - timeSinceLastCall);

      if (waitTime > 0) {
        logger.debug({ waitTime }, 'Rate limiter slowing down requests');
        await this.delay(waitTime);
      }

      const resolve = this.queue.shift();
      if (resolve) {
        this.lastCallTime = Date.now();
        resolve();
      }
    }

    this.isProcessing = false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const aiRateLimiter = new RateLimiter(12); // Optimized for Gemini Free Tier
