import NodeCache from 'node-cache';
import { logger } from '../logging/logger';

export class CacheService {
  private static instance: CacheService;
  private readonly cache: NodeCache;

  private constructor() {
    this.cache = new NodeCache({
      stdTTL: 3600, // 1 hour default
      checkperiod: 60,
      useClones: false,
    });
    logger.info('CacheService initialized');
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  public get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value) {
      logger.debug({ key }, 'Cache hit');
    }
    return value;
  }

  public set<T>(key: string, value: T, ttl?: number): boolean {
    logger.debug({ key, ttl }, 'Caching value');
    return this.cache.set(key, value, ttl ?? 3600);
  }

  public delete(key: string): number {
    return this.cache.del(key);
  }

  public flush(): void {
    this.cache.flushAll();
    logger.info('Cache flushed');
  }

  public generateKey(prefix: string, data: any): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    // Simple hash for keying
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `${prefix}:${hash}`;
  }
}

export const cacheService = CacheService.getInstance();
