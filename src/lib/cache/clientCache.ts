/**
 * Lightweight in-memory Client Cache for ultra-fast page transitions & SWR pattern.
 * Enables instant 0ms tab switching while refreshing data in the background.
 */

type CacheEntry<T> = {
  data: T;
  timestamp: number;
  maxAgeMs?: number;
};

const cache = new Map<string, CacheEntry<any>>();

export function getCachedData<T>(key: string, maxAgeMs = 25000): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const ttl = entry.maxAgeMs ?? maxAgeMs;
  if (Date.now() - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T, maxAgeMs?: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    maxAgeMs,
  });
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
