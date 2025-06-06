import { logger } from './logger';

// Simple in-memory cache implementation
class Cache<T> {
  private cache: Map<string, { data: T; expiry: number | null }>;
  
  constructor() {
    this.cache = new Map();
    logger.info('Cache initialized');
  }
  
  /**
   * Set a value in the cache with an optional expiry time in milliseconds
   */
  set(key: string, value: T, ttlMs?: number): void {
    const expiry = ttlMs ? Date.now() + ttlMs : null;
    this.cache.set(key, { data: value, expiry });
    logger.debug(`Cache entry set for key: ${key}`);
  }
  
  /**
   * Get a value from the cache
   * Returns undefined if not found or expired
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if entry has expired
    if (entry.expiry && entry.expiry < Date.now()) {
      logger.debug(`Cache entry expired for key: ${key}`);
      this.cache.delete(key);
      return undefined;
    }
    
    logger.debug(`Cache hit for key: ${key}`);
    return entry.data;
  }
  
  /**
   * Remove a value from the cache
   */
  delete(key: string): boolean {
    logger.debug(`Cache entry deleted for key: ${key}`);
    return this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
    logger.debug('Cache cleared');
  }
}

// Export instances for different cache purposes
export const analysisCache = new Cache<any>();
export const scoreCache = new Cache<any>();